import { Router } from 'express';
import { spawn } from 'child_process';

const router = Router();

const PROVIDERS = {
  openai: {
    buildUrl: (base) => `${base}/chat/completions`,
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (messages, model, stream) => ({
      model,
      messages,
      stream,
      max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '2048'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7')
    }),
    parseChunk(line) {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return { done: true };
      try {
        const json = JSON.parse(data);
        return { content: json.choices?.[0]?.delta?.content || '' };
      } catch { return null; }
    },
    parseSync(json) {
      return json.choices?.[0]?.message?.content || '';
    }
  },

  anthropic: {
    buildUrl: (base) => `${base}/messages`,
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }),
    buildBody: (messages, model, stream) => {
      const system = messages.find(m => m.role === 'system')?.content || '';
      const filtered = messages.filter(m => m.role !== 'system');
      return {
        model,
        system,
        messages: filtered,
        stream,
        max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '2048')
      };
    },
    parseChunk(line) {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6).trim();
      try {
        const json = JSON.parse(data);
        if (json.type === 'content_block_delta') {
          return { content: json.delta?.text || '' };
        }
        if (json.type === 'message_stop') {
          return { done: true };
        }
        return null;
      } catch { return null; }
    },
    parseSync(json) {
      return json.content?.[0]?.text || '';
    }
  }
};

function getProvider() {
  const name = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
  return name === 'claude-cli' ? null : (PROVIDERS[name] || PROVIDERS.openai);
}

function isCliProvider() {
  return (process.env.LLM_PROVIDER || '').toLowerCase() === 'claude-cli';
}

// Spawn claude CLI and stream response as SSE
function handleClaudeCliStream(messages, req, res) {
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const conversation = messages.filter(m => m.role !== 'system');
  const lastMessage = conversation[conversation.length - 1]?.content || '';

  // Build system prompt with conversation history for multi-turn
  let systemPrompt = systemMsg;
  if (conversation.length > 1) {
    const history = conversation.slice(0, -1)
      .map(m => `${m.role === 'user' ? 'Nutzer' : 'Assistent'}: ${m.content}`)
      .join('\n\n');
    systemPrompt += `\n\nBisheriger Gesprächsverlauf:\n${history}`;
  }

  const args = [
    '-p', lastMessage,
    '--output-format', 'stream-json',
    '--include-partial-messages',
    '--no-session-persistence',
    '--tools', '',
  ];

  if (systemPrompt) {
    args.push('--system-prompt', systemPrompt);
  }

  const model = process.env.LLM_MODEL;
  if (model) args.push('--model', model);

  // Remove all Claude Code env vars to prevent nested-session detection
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith('CLAUDE')) delete env[key];
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const claude = spawn('claude', args, { env });
  let buffer = '';

  claude.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);

        // stream-json wraps events in {"type":"stream_event","event":{...}}
        if (json.type === 'stream_event') {
          const evt = json.event;
          if (evt?.type === 'content_block_delta' && evt?.delta?.type === 'text_delta') {
            res.write(`data: ${JSON.stringify({ content: evt.delta.text })}\n\n`);
          }
          if (evt?.type === 'message_stop') {
            res.write('data: [DONE]\n\n');
          }
        }

        // Final result event
        if (json.type === 'result') {
          if (!res.writableEnded) {
            res.write('data: [DONE]\n\n');
          }
        }
      } catch { /* skip non-JSON lines */ }
    }
  });

  claude.stderr.on('data', (data) => {
    console.error('[claude-cli stderr]', data.toString());
  });

  claude.stdout.on('data', (data) => {
    console.error('[claude-cli stdout]', data.toString().slice(0, 500));
  });

  claude.on('close', (code) => {
    if (!res.writableEnded) {
      if (code !== 0) {
        res.write(`data: ${JSON.stringify({ content: '\n\n[Fehler: Claude CLI beendet mit Code ' + code + ']' })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  claude.on('error', (err) => {
    console.error('[claude-cli] spawn error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: `Claude CLI nicht gefunden: ${err.message}` });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ content: '\n\n[Fehler: ' + err.message + ']' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  // Clean up on client disconnect
  req.on('close', () => {
    if (!claude.killed) claude.kill();
  });
}

// POST /api/chat — streaming (SSE)
router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Claude CLI provider — spawn process instead of HTTP
  if (isCliProvider()) {
    return handleClaudeCliStream(messages, req, res);
  }

  const provider = getProvider();
  const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.LLM_API_KEY || '';
  const model = process.env.LLM_MODEL || 'gpt-4o';

  const url = provider.buildUrl(apiUrl);
  const headers = provider.buildHeaders(apiKey);
  const body = provider.buildBody(messages, model, true);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parsed = provider.parseChunk(trimmed);
        if (!parsed) continue;

        if (parsed.done) {
          res.write('data: [DONE]\n\n');
        } else if (parsed.content) {
          res.write(`data: ${JSON.stringify({ content: parsed.content })}\n\n`);
        }
      }
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.end();
    }
  }
});

// POST /api/chat/sync — non-streaming
router.post('/chat/sync', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (isCliProvider()) {
    return res.status(501).json({ error: 'Sync mode not supported for claude-cli provider' });
  }

  const provider = getProvider();
  const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.LLM_API_KEY || '';
  const model = process.env.LLM_MODEL || 'gpt-4o';

  const url = provider.buildUrl(apiUrl);
  const headers = provider.buildHeaders(apiKey);
  const body = provider.buildBody(messages, model, false);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const json = await response.json();
    const content = provider.parseSync(json);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/health
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.LLM_MODEL || 'gpt-4o'
  });
});

// GET /api/config — safe to expose (no keys)
router.get('/config', (_req, res) => {
  res.json({
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.LLM_MODEL || 'gpt-4o'
  });
});

export default router;
