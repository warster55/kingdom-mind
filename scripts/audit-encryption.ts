import { db } from '@/lib/db';
import { chatMessages, insights } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

async function audit() {
  console.log('🛡️ Starting Encryption Audit...');

  const messages = await db.select({ content: chatMessages.content }).from(chatMessages).limit(5);
  const userInsights = await db.select({ content: insights.content }).from(insights).limit(5);

  let passed = true;

  console.log('\n--- Chat Messages ---');
  if (messages.length === 0) console.log('No messages found to audit.');
  messages.forEach((m, i) => {
    const isEncrypted = m.content.includes(':');
    console.log(`Msg ${i+1}: ${isEncrypted ? '✅ ENCRYPTED' : '❌ PLAIN TEXT'}`);
    if (!isEncrypted) passed = false;
  });

  console.log('\n--- Insights ---');
  if (userInsights.length === 0) console.log('No insights found to audit.');
  userInsights.forEach((ins, i) => {
    const isEncrypted = ins.content.includes(':');
    console.log(`Insight ${i+1}: ${isEncrypted ? '✅ ENCRYPTED' : '❌ PLAIN TEXT'}`);
    if (!isEncrypted) passed = false;
  });

  if (passed) {
    console.log('\n💎 Audit Passed: All sampled data is encrypted.');
  } else {
    console.log('\n⚠️ Audit Failed: Plain text data detected!');
    process.exit(1);
  }
}

audit().catch(console.error);
