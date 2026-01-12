import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

const WINDOW_MS = 60 * 1000; // 1 Minute
const LIMIT = 10; // 10 Messages per minute

export async function rateLimit(key: string): Promise<{ success: boolean; remaining: number }> {
  try {
    const now = new Date();
    
    // 1. Clean up expired keys (Self-Maintenance)
    // In a high-traffic app, this would be a cron job, but for a Sanctuary, doing it inline is fine.
    await db.execute(sql`DELETE FROM rate_limits WHERE expires_at < ${now}`);

    // 2. Check/Insert Key
    // Upsert logic: If key exists, update count. If not, insert with count 1.
    // However, standard Postgres UPSERT is tricky with expiration logic in one query.
    // We will do a simple Check-then-Update for clarity and safety.

    const result = await db.execute(sql`SELECT count, expires_at FROM rate_limits WHERE key = ${key}`);
    
    if (result.rowCount === 0) {
      // New Window
      const expiresAt = new Date(now.getTime() + WINDOW_MS);
      await db.execute(sql`INSERT INTO rate_limits (key, count, expires_at) VALUES (${key}, 1, ${expiresAt})`);
      return { success: true, remaining: LIMIT - 1 };
    }

    const row = result.rows[0];
    const count = parseInt(row.count as string);

    if (count >= LIMIT) {
      return { success: false, remaining: 0 };
    }

    // Increment
    await db.execute(sql`UPDATE rate_limits SET count = count + 1 WHERE key = ${key}`);
    return { success: true, remaining: LIMIT - (count + 1) };

  } catch (error) {
    console.error('Rate Limit Error:', error);
    // Fail Open: If DB is down, allow traffic to prevent blocking legitimate users during outages.
    return { success: true, remaining: 1 };
  }
}
