import { db } from '@/lib/db';
import { systemPrompts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function cleanPrompt() {
  console.log('🧹 Cleaning System Prompt (Removing illuminateDomains legacy tags)...');

  const current = await db.select().from(systemPrompts)
    .where(eq(systemPrompts.isActive, true))
    .orderBy(desc(systemPrompts.version))
    .limit(1);

  if (!current[0]) return;

  let content = current[0].content;

  // 1. Replace illuminateDomains instructions
  content = content.replace(/Use illuminateDomains\./g, "Use the Breakthrough Star protocol.");
  content = content.replace(/Call illuminateDomains\./g, "");
  content = content.replace(/Call scribeReflection immediately upon breakthrough\./g, "Identify breakthroughs using the Resonance tag.");
  
  // 2. Fix Final Command
  content = content.replace(/Call illuminateDomains\. /g, "");

  // 3. Save new version
  await db.update(systemPrompts).set({ isActive: false }).where(eq(systemPrompts.isActive, true));
  
  await db.insert(systemPrompts).values({
    version: current[0].version + 1,
    content: content,
    changeLog: 'Removed legacy illuminateDomains tags to stop raw function leaks',
    isActive: true
  });

  console.log('✅ System Prompt v3 Deployed (Cleaned).');
}

cleanPrompt().catch(console.error);
