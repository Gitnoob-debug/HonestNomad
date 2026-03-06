/**
 * App configuration constants.
 * NEXT_PUBLIC_* env vars are inlined at build time in Next.js.
 * We provide hardcoded defaults so the app works even if Vercel
 * env vars aren't picked up correctly.
 */

export const WHITELABEL_DOMAIN =
  process.env.NEXT_PUBLIC_WHITELABEL_DOMAIN || 'flashtravel.dev';
