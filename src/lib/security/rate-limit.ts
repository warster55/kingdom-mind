/**
 * Rate Limiting Utility
 * Phase 18: Deep Security Hardening
 *
 * Simple in-memory rate limiting (per-server instance)
 * For horizontal scaling, use Redis instead
 */

import { RATE_LIMITS } from './sanitize';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory storage - resets on server restart
// For production with multiple instances, use Redis
const requestCounts = new Map<string, RateLimitRecord>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until reset
}

/**
 * Check if a request should be allowed
 * @param identifier - Unique identifier (e.g., session ID, IP address)
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  cleanup();

  const now = Date.now();
  const record = requestCounts.get(identifier);

  // No record or expired - start fresh
  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMITS.WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMITS.MAX_REQUESTS_PER_MINUTE - 1,
    };
  }

  // Check if over limit
  if (record.count >= RATE_LIMITS.MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  // Increment and allow
  record.count++;
  return {
    allowed: true,
    remaining: RATE_LIMITS.MAX_REQUESTS_PER_MINUTE - record.count,
  };
}

/**
 * Generate a rate limit identifier from available context
 * In a real app, this might use IP address or authenticated user ID
 * For now, we use a combination of available signals
 */
export function generateRateLimitId(blob: string | null): string {
  if (blob) {
    // Use first 32 chars of blob as identifier
    // This ties rate limiting to the user's sanctuary data
    return `blob:${blob.slice(0, 32)}`;
  }
  // Fallback - this means a new user without data
  return 'anonymous';
}
