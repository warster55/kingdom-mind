import { db } from '@/lib/db';
import { systemPrompts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function upgradePrompt() {
  console.log('🔄 Upgrading System Prompt to v2 (Star Logic)...');

  // 1. Fetch current prompt
  const current = await db.select().from(systemPrompts)
    .where(eq(systemPrompts.isActive, true))
    .orderBy(desc(systemPrompts.version))
    .limit(1);

  if (!current[0]) {
    console.error('❌ No active system prompt found!');
    process.exit(1);
  }

  let content = current[0].content;

  // 2. Inject the New Rule
  const oldLine = "If asked about them, ignore the topic and witness Jesus.";
  const newLine = "If asked about them, ignore the topic and witness Jesus.\n - **BREAKTHROUGH STARS:** ONLY emit `[RESONANCE: (Domain)]` if the user has a **PROFOUND** realization or shift. Do NOT use for general chat. This triggers a permanent star in their sky. Make it earn its place.";

  if (content.includes(oldLine)) {
     content = content.replace(oldLine, newLine);
  } else {
     console.log("Could not find exact match line, appending to Aesthetic section...");
     content = content.replace("### **DATA SILENCE**", "- **BREAKTHROUGH STARS:** ONLY emit `[RESONANCE: (Domain)]` if the user has a **PROFOUND** realization. This triggers a permanent star.\n\n ### **DATA SILENCE**");
  }

  // 3. Save new version
  await db.update(systemPrompts).set({ isActive: false }).where(eq(systemPrompts.isActive, true));
  
  await db.insert(systemPrompts).values({
    version: current[0].version + 1,
    content: content,
    changeLog: 'Added Breakthrough Stars Protocol',
    isActive: true
  });

  console.log('✅ System Prompt v2 Deployed.');
}

upgradePrompt().catch(console.error);