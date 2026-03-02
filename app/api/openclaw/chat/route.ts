// OpenClaw Agent Chat Endpoint
// POST /api/openclaw/chat
//
// Receives natural language messages from OpenClaw agent platforms,
// orchestrates hotel discovery through our HN Agent (Claude Haiku),
// and returns curated, branded responses.
//
// This endpoint is the ONLY entry point for agent integrations.
// It does NOT touch any existing Discover or Flash flow code/routes.

import { NextRequest, NextResponse } from 'next/server';
import { runAgent } from '@/lib/openclaw/agent';
import { checkRateLimit } from '@/lib/openclaw/rateLimiter';
import { randomUUID } from 'crypto';
import type { AgentChatRequest, AgentMessage } from '@/lib/openclaw/types';

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting ─────────────────────────────────────────────
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfterMs: rateLimit.retryAfterMs,
          message: 'Too many requests. Please try again shortly.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.retryAfterMs || 60000) / 1000)),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    // ── Parse and validate request ────────────────────────────────
    const body = await request.json() as AgentChatRequest;

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty messages array' },
        { status: 400 }
      );
    }

    // Validate message format
    const validRoles = new Set(['user', 'assistant']);
    for (const msg of body.messages) {
      if (!validRoles.has(msg.role) || typeof msg.content !== 'string') {
        return NextResponse.json(
          { error: 'Invalid message format. Each message needs { role: "user"|"assistant", content: string }' },
          { status: 400 }
        );
      }
    }

    // Limit conversation history to prevent token abuse
    const MAX_MESSAGES = 30;
    const messages: AgentMessage[] = body.messages.slice(-MAX_MESSAGES);

    // Session ID — reuse or create new
    const sessionId = body.sessionId || randomUUID();

    // ── Run agent ─────────────────────────────────────────────────
    console.log(`[openclaw/chat] Processing request (session: ${sessionId}, messages: ${messages.length}, ip: ${clientIp})`);

    const result = await runAgent(messages, sessionId);

    console.log(`[openclaw/chat] Response ready (session: ${sessionId}, hasImages: ${!!result.images}, hasBookingLink: ${!!result.bookingLink})`);

    // ── Return response ───────────────────────────────────────────
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-Session-Id': sessionId,
      },
    });

  } catch (error) {
    console.error('[openclaw/chat] Error:', error);

    // Don't leak internal errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isConfigError = message.includes('API_KEY') || message.includes('not configured');

    return NextResponse.json(
      {
        error: isConfigError
          ? 'Service temporarily unavailable. Please try again later.'
          : 'Failed to process request',
        response: 'I apologize, but I\'m having trouble right now. Could you try again in a moment?',
        sessionId: 'error',
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'HonestNomad OpenClaw Agent',
    status: 'online',
    version: '1.0.0',
    capabilities: [
      'destination_search',
      'hotel_search',
      'booking_link_generation',
    ],
  });
}
