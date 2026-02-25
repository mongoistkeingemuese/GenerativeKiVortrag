import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Start the server for testing
let server;
const PORT = 9876;

before(async () => {
  process.env.PORT = PORT;
  process.env.LLM_PROVIDER = 'openai';
  process.env.LLM_MODEL = 'test-model';
  process.env.LLM_API_URL = 'https://api.example.com/v1';
  process.env.LLM_API_KEY = 'test-key';

  // Dynamic import to pick up env vars
  const { default: express } = await import('express');
  const { default: llmRoutes } = await import('../routes/llm.js');

  const app = express();
  app.use(express.json());
  app.use('/api', llmRoutes);

  server = app.listen(PORT);
});

after(() => {
  if (server) server.close();
});

const base = `http://localhost:${PORT}`;

describe('GET /api/health', () => {
  it('returns status ok with provider info', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.provider, 'openai');
    assert.equal(data.model, 'test-model');
  });
});

describe('GET /api/config', () => {
  it('returns provider and model without API key', async () => {
    const res = await fetch(`${base}/api/config`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.provider, 'openai');
    assert.equal(data.model, 'test-model');
    assert.equal(data.apiKey, undefined);
  });
});

describe('POST /api/chat', () => {
  it('rejects missing messages', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);

    const data = await res.json();
    assert.ok(data.error.includes('messages'));
  });

  it('rejects non-array messages', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: 'not-an-array' })
    });
    assert.equal(res.status, 400);
  });
});

describe('POST /api/chat/sync', () => {
  it('rejects missing messages', async () => {
    const res = await fetch(`${base}/api/chat/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);

    const data = await res.json();
    assert.ok(data.error.includes('messages'));
  });
});
