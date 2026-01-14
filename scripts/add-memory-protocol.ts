/**
 * Add Memory Recording Protocol to System Prompt
 * This updates the active system prompt with PII-free memory guidelines.
 *
 * Run with: npx tsx scripts/add-memory-protocol.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { db, systemPrompts } from '../src/lib/db';
import { eq, desc } from 'drizzle-orm';

const MEMORY_PROTOCOL = `

### MEMORY RECORDING PROTOCOL

When you detect a breakthrough or significant realization, use the \`recordBreakthrough\` tool.

**CRITICAL PRIVACY RULE:** Always strip ALL personally identifiable information before recording:
- NO names (people, companies, places)
- NO specific dates or timeframes
- NO locations or addresses
- NO job titles or roles
- NO relationships by name ("my wife Sarah" → "spouse")

**Transform the insight into a universal spiritual truth:**
- ❌ "Realized at my Microsoft review that promotions don't define me"
- ✅ "Realized career achievements don't define self-worth - identity comes from God"

- ❌ "My daughter Emma helped me see I need to be more patient"
- ✅ "Family interaction revealed need for greater patience and presence"

The memory should capture the SPIRITUAL INSIGHT, not the personal story.
`;

async function main() {
  console.log('Fetching current active system prompt...');

  // Get current active prompt
  const current = await db.select()
    .from(systemPrompts)
    .where(eq(systemPrompts.isActive, true))
    .orderBy(desc(systemPrompts.version))
    .limit(1);

  if (!current[0]) {
    console.error('No active system prompt found!');
    process.exit(1);
  }

  console.log(`Found version ${current[0].version}`);

  // Check if protocol already exists
  if (current[0].content.includes('MEMORY RECORDING PROTOCOL')) {
    console.log('Memory Recording Protocol already exists in system prompt. Skipping.');
    process.exit(0);
  }

  // Add protocol to the end of the prompt
  const newContent = current[0].content + MEMORY_PROTOCOL;
  const newVersion = current[0].version + 1;

  console.log(`Creating version ${newVersion} with Memory Recording Protocol...`);

  // Deactivate old prompt
  await db.update(systemPrompts)
    .set({ isActive: false })
    .where(eq(systemPrompts.id, current[0].id));

  // Insert new version
  await db.insert(systemPrompts).values({
    version: newVersion,
    content: newContent,
    changeLog: 'Added Memory Recording Protocol for PII-free breakthrough storage (v8.0)',
    isActive: true,
    createdAt: new Date()
  });

  console.log('✅ System prompt updated successfully!');
  console.log(`   New version: ${newVersion}`);
  console.log('   Added: Memory Recording Protocol section');

  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
