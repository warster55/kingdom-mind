/**
 * Health tracking for system prompt loading
 * Separate from server actions to avoid 'use server' restrictions
 */

// Module-level state for tracking system prompt health
let lastSystemPromptSource: 'database' | 'fallback' | null = null;
let lastSystemPromptError: string | null = null;
let lastSystemPromptTimestamp: number | null = null;

/**
 * Update the system prompt health status
 * Called from chat.ts when loading system prompt
 */
export function setSystemPromptHealth(
  source: 'database' | 'fallback',
  error: string | null = null
): void {
  lastSystemPromptSource = source;
  lastSystemPromptError = error;
  lastSystemPromptTimestamp = Date.now();
}

/**
 * Get the health status of the system prompt loading
 * Used by /api/health endpoint
 */
export function getSystemPromptHealthStatus(): {
  source: 'database' | 'fallback' | 'unknown';
  timestamp: number | null;
  error: string | null;
} {
  return {
    source: lastSystemPromptSource || 'unknown',
    timestamp: lastSystemPromptTimestamp,
    error: lastSystemPromptError,
  };
}
