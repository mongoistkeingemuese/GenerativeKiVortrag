import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import llmRoutes from './routes/llm.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// API routes
app.use('/api', llmRoutes);

// Serve presentation static files
app.use(express.static(join(__dirname, '..', 'presentation')));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'presentation', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`REX running on http://localhost:${PORT}`);
  console.log(`LLM Provider: ${process.env.LLM_PROVIDER || 'openai'}`);
  console.log(`LLM Model: ${process.env.LLM_MODEL || 'gpt-4o'}`);
});
