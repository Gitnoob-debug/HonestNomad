import OpenAI from 'openai';

// Model — override via OPENROUTER_MODEL env var
export const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4.6';

// Token budgets
export const MAX_TOKENS = 2048;
export const MAGIC_PACKAGE_MAX_TOKENS = 6144;

// ============================================
// OpenRouter Client
// ============================================

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
