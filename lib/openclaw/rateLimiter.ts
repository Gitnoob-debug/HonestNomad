// Simple in-memory rate limiter for OpenClaw agent endpoint
// Tracks requests per IP/session with sliding window
// In production, use Redis or Upstash for distributed rate limiting

import type { RateLimitResult } from './types';

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store (resets on cold start — fine for v1)
const store = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60 * 1000; // 1-minute sliding window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per key
const MAX_HOTEL_SEARCHES_PER_SESSION = 5; // Max hotel search calls per session (expensive)

// Global daily cap
let dailyRequestCount = 0;
let dailyResetAt = getNextMidnight();
const DAILY_CAP = 1000; // Total requests across all users per day

// Kill switch
let killSwitchActive = false;

/**
 * Check if a request is allowed under rate limits.
 * @param key - Rate limit key (IP address or session ID)
 */
export function checkRateLimit(key: string): RateLimitResult {
  // Kill switch check
  if (killSwitchActive) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 3600000, // 1 hour
      retryAfterMs: 3600000,
    };
  }

  // Daily cap check
  const now = Date.now();
  if (now > dailyResetAt) {
    dailyRequestCount = 0;
    dailyResetAt = getNextMidnight();
  }
  if (dailyRequestCount >= DAILY_CAP) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: dailyResetAt,
      retryAfterMs: dailyResetAt - now,
    };
  }

  // Per-key sliding window
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  const windowStart = now - WINDOW_MS;
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + WINDOW_MS - now;
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + WINDOW_MS,
      retryAfterMs,
    };
  }

  // Allow request
  entry.timestamps.push(now);
  dailyRequestCount++;

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - entry.timestamps.length,
    resetAt: now + WINDOW_MS,
  };
}

/**
 * Check hotel search-specific rate limit (more expensive operation).
 * Tracked separately from general requests.
 */
export function checkHotelSearchLimit(sessionId: string): boolean {
  const key = `hotel_search:${sessionId}`;
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Hotel search limit is per-session, not per-window
  // (no expiry — persists for the life of the session)
  if (entry.timestamps.length >= MAX_HOTEL_SEARCHES_PER_SESSION) {
    return false;
  }

  entry.timestamps.push(Date.now());
  return true;
}

/**
 * Activate the kill switch — blocks all requests.
 */
export function activateKillSwitch(): void {
  killSwitchActive = true;
  console.warn('[openclaw/rateLimiter] KILL SWITCH ACTIVATED — all requests blocked');
}

/**
 * Deactivate the kill switch.
 */
export function deactivateKillSwitch(): void {
  killSwitchActive = false;
  console.log('[openclaw/rateLimiter] Kill switch deactivated');
}

/**
 * Get current rate limit stats (for monitoring).
 */
export function getRateLimitStats(): {
  dailyRequests: number;
  dailyCap: number;
  dailyResetAt: number;
  killSwitchActive: boolean;
  uniqueKeys: number;
} {
  return {
    dailyRequests: dailyRequestCount,
    dailyCap: DAILY_CAP,
    dailyResetAt,
    killSwitchActive,
    uniqueKeys: store.size,
  };
}

function getNextMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS * 10; // Keep entries for 10 windows
    const keys = Array.from(store.keys());
    for (const key of keys) {
      const entry = store.get(key);
      if (!entry || entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
