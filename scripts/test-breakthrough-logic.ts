import { db, users } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testLogic() {
  console.log('🧪 Testing Breakthrough Logic (Server-Side)...');

  const userId = 15; // Testing on Shiro's account
  const domain = 'Identity';

  // 1. Get Initial State
  const before = await db.select({ count: users.resonanceIdentity })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const initialCount = before[0]?.count || 0;
  console.log(`   Initial ${domain} Count: ${initialCount}`);

  // 2. Simulate the Logic Block from chat.ts
  console.log(`   Simulating [RESONANCE: ${domain}] event...`);
  
  try {
    // This is the EXACT logic from src/lib/actions/chat.ts
    if (domain === 'Identity') {
      await db.update(users).set({ resonanceIdentity: sql`${users.resonanceIdentity} + 1` }).where(eq(users.id, userId));
    }
    
    // 3. Verify Result
    const after = await db.select({ count: users.resonanceIdentity })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const finalCount = after[0]?.count || 0;
    console.log(`   Final ${domain} Count: ${finalCount}`);

    if (finalCount === initialCount + 1) {
      console.log('✅ PASS: Breakthrough logic correctly updated the database.');
    } else {
      console.error('❌ FAIL: Database count did not increment correctly.');
      process.exit(1);
    }
  } catch (e: any) {
    console.error('❌ FAIL: SQL Error during update:', e.message);
    process.exit(1);
  }
}

testLogic().catch(console.error);
