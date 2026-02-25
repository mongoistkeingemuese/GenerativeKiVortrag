import { Router } from 'express';

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
  return PROVIDERS[name] || PROVIDERS.openai;
}

// POST /api/chat — streaming (SSE)
router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
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
    model: process.env.LLM_MODEL || 'gpt-4o',
    apiUrl: process.env.LLM_API_URL || 'https://api.openai.com/v1'
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
