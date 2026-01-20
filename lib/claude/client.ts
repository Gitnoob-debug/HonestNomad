import OpenAI from 'openai';

// Lazy-load the OpenRouter client to avoid build-time errors
let _openrouter: OpenAI | null = null;

export function getOpenRouterClient(): OpenAI {
  if (!_openrouter) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required');
    }
    _openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'HonestNomad',
      },
    });
  }
  return _openrouter;
}

// For backwards compatibility - getter that lazy-loads
export const openrouter = new Proxy({} as OpenAI, {
  get(_, prop) {
    return (getOpenRouterClient() as any)[prop];
  },
});

export const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
export const MAX_TOKENS = 2048;
