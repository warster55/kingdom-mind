import { db } from '@/lib/db';
import { rateLimits } from '@/lib/db/schema';
import { lt, eq, sql } from 'drizzle-orm';

const WINDOW_MS = 60 * 1000; // 1 Minute
const LIMIT = 10; // 10 Messages per minute

export async function rateLimit(key: string): Promise<{ success: boolean; remaining: number }> {
  try {
    const now = new Date();
    
    // 1. Clean up expired keys
    await db.delete(rateLimits).where(lt(rateLimits.expiresAt, now));

    // 2. Check for existing key
    const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
    
    if (!row) {
      // New Window
      const expiresAt = new Date(now.getTime() + WINDOW_MS);
      await db.insert(rateLimits).values({ key, count: 1, expiresAt });
      return { success: true, remaining: LIMIT - 1 };
    }

    if (row.count >= LIMIT) {
      return { success: false, remaining: 0 };
    }

    // Increment
    await db.update(rateLimits)
      .set({ count: row.count + 1 })
      .where(eq(rateLimits.key, key));
      
    return { success: true, remaining: LIMIT - (row.count + 1) };

  } catch (error) {
    console.error('Rate Limit Error:', error);
    // Fail Open
    return { success: true, remaining: 1 };
  }
}
