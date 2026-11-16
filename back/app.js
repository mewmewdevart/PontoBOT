import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'node:url';
import { topics, systemInstruction, getFallback, getModelAnswer } from './lib/knowledge.js';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true });

const app = express();
app.disable('x-powered-by');

const key = process.env.GEMINI_API_KEY?.trim();
const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite';
const ai = key ? new GoogleGenAI({ apiKey: key }) : null;
const defaultOrigins = [
  'http://127.0.0.1:4178',
  'http://localhost:4178',
  'https://mutirao-pontobot-frontend.vercel.app',
  'https://mutirao-citizen-tech.vercel.app',
];
const origins = new Set(process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? defaultOrigins);
const allowOrigin = (origin) => origins.has(origin) || origin === `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
const chatCors = cors({ origin: (origin, done) => done(null, Boolean(origin && allowOrigin(origin))), methods: ['POST', 'OPTIONS'], allowedHeaders: ['Content-Type'], maxAge: 600 });
const parseBody = express.json({ limit: '16kb' });
const maxHistory = 6;

const responseJsonSchema = {
  type: 'object',
  properties: { topic: { type: 'string', enum: Object.keys(topics) }, reply: { type: 'string' } },
  required: ['topic', 'reply'],
};

function validHistory(history) {
  return Array.isArray(history) && history.length <= maxHistory && history.length % 2 === 0 &&
    history.every((item, index) => {
      const role = index % 2 === 0 ? 'user' : 'model';
      return item?.role === role && typeof item.text === 'string' && item.text.trim().length > 0 &&
        item.text.length <= (role === 'user' ? 240 : 700);
    });
}

app.get(['/', '/api/health'], (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ status: 'ok', geminiConfigured: Boolean(ai), model: ai ? model : null });
});

app.use('/api/chat', (req, res, next) => {
  res.set('Cache-Control', 'no-store').vary('Origin');
  const origin = req.get('Origin');
  if (origin && !allowOrigin(origin)) return res.status(403).json({ error: 'Origem não autorizada.' });
  next();
}, chatCors);

app.post('/api/chat', parseBody, async (req, res) => {
  if (!req.is('application/json')) return res.status(415).json({ error: 'Envie a pergunta em JSON.' });
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  const history = req.body?.history === undefined ? [] : req.body.history;

  if (!question || question.length > 240 || !validHistory(history)) {
    return res.status(400).json({ error: 'Envie uma pergunta de até 240 caracteres e um histórico válido.' });
  }
  if (!ai) return res.json(getFallback(question));

  const contents = [...history, { role: 'user', text: question }].map(({ role, text }) => ({
    role,
    parts: [{ text }],
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseJsonSchema,
        maxOutputTokens: 512,
        abortSignal: AbortSignal.timeout(8000),
      },
    });
    return res.json(getModelAnswer(response.text));
  } catch (error) {
    console.warn('PontoBOT: Gemini indisponível ou retornou uma resposta inválida.', error?.message ?? error);
    return res.json(getFallback(question));
  }
});

app.all('/api/chat', (_req, res) => {
  res.set('Allow', 'POST, OPTIONS').status(405).json({ error: 'Use POST.' });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'O corpo da requisição é muito grande.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Envie um JSON válido.' });
  if (error.status === 415) return res.status(415).json({ error: 'Formato de requisição não aceito.' });
  console.error('PontoBOT: falha ao processar requisição.');
  return res.status(500).json({ error: 'Não foi possível processar a pergunta.' });
});

export default app;

