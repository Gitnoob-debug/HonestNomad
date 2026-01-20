import OpenAI from 'openai';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is required');
}

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'HonestNomad',
  },
});

export const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
export const MAX_TOKENS = 2048;
