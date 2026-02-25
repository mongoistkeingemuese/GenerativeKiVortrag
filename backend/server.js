import express from 'express';
import llmRoutes from './routes/llm.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', llmRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`REX Backend running on port ${PORT}`);
  console.log(`LLM Provider: ${process.env.LLM_PROVIDER || 'openai'}`);
  console.log(`LLM Model: ${process.env.LLM_MODEL || 'gpt-4o'}`);
});
