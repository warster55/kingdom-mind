/**
 * Site Status Check with Caching
 *
 * Checks if the site is enabled via the app_config table.
 * Uses a simple in-memory cache to avoid hammering the database.
 */
import { db, appConfig } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Cache configuration
const CACHE_TTL_MS = 5000; // 5 seconds cache

// In-memory cache
let cachedStatus: { enabled: boolean; timestamp: number } | null = null;

/**
 * Check if the site is enabled.
 * Returns true (enabled) by default if:
 * - No config exists (fail open for new installs)
 * - Database error occurs (fail open to avoid lockout)
 *
 * Returns cached value if within TTL to reduce DB load.
 */
export async function isSiteEnabled(): Promise<boolean> {
  const now = Date.now();

  // Return cached value if fresh
  if (cachedStatus && (now - cachedStatus.timestamp) < CACHE_TTL_MS) {
    return cachedStatus.enabled;
  }

  try {
    const result = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, 'site_enabled'))
      .limit(1);

    // Default to enabled if no config exists
    if (!result.length) {
      cachedStatus = { enabled: true, timestamp: now };
      return true;
    }

    // Parse the value - expects { enabled: boolean }
    const config = result[0].value as { enabled?: boolean } | null;
    const enabled = config?.enabled !== false; // Default to true if malformed

    cachedStatus = { enabled, timestamp: now };
    return enabled;
  } catch (error) {
    console.error('[site-status] Error checking site status:', error);
    // Fail open - if we can't check, allow access
    return true;
  }
}

/**
 * Clear the cache (useful for testing or after config changes)
 */
export function clearSiteStatusCache(): void {
  cachedStatus = null;
}
