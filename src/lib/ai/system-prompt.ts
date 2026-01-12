import { db, sacredPillars, systemPrompts, users } from '@/lib/db';
import { asc, desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm'; // Import sql for potential use in appConfig's onConflictDoUpdate

/**
 * Kingdom Mind - The Sovereign Template Engine (v5.0)
 * DATABASE-DRIVEN FLUIDITY + USER PERSONALIZATION
 */

export interface PromptContext {
  userName: string;
  userId?: number;
  currentDomain: string;
  progress: number;
  lastInsight?: string;
  localTime: string;
  hasCompletedOnboarding: boolean;
  onboardingStage: number;
  currentPillar?: { name: string; truth: string; verse: string; description: string }; 
}

export async function buildSanctuaryPrompt(context: PromptContext): Promise<string> {
  const { userName, userId, currentDomain, progress, lastInsight, localTime, hasCompletedOnboarding, onboardingStage, currentPillar } = context;

  // 1. Fetch The Master Prompt
  const promptRecord = await db.select().from(systemPrompts)
    .where(eq(systemPrompts.isActive, true))
    .orderBy(desc(systemPrompts.version))
    .limit(1);
  
  const masterTemplate = promptRecord[0]?.content || "ERROR: System Prompt Missing. Contact Architect.";

  // 2. Fetch The Eternal Truths
  const pillars = await db.select().from(sacredPillars).orderBy(asc(sacredPillars.order));
  const pillarText = pillars.map((p, i) => `${i+1}. ${p.content}`).join('\n');

  // 3. Fetch User Preferences (The Adaptive Layer)
  let userPrefsText = "Standard Mentor Mode.";
  // Note: Preferences column not yet migrated to V3 schema. Disabled for now.
  /*
  if (userId) {
    try {
      const userResult = await db.select({ preferences: users.preferences }).from(users).where(eq(users.id, userId)).limit(1);
      const user = userResult[0];
      const prefs = user?.preferences;
      // Precise check for non-null object
      if (prefs !== null && typeof prefs === 'object' && !Array.isArray(prefs)) {
        const entries = Object.entries(prefs as Record<string, string>);
        if (entries.length > 0) {
          userPrefsText = entries.map(([k, v]) => `- ${k}: ${v}`).join('\n');
        }
      }
    } catch (e) {
      console.warn("Preferences Error:", e);
    }
  }
  */

  // 4. Determine Dynamic Protocol
  const protocol = hasCompletedOnboarding 
    ? (currentPillar 
        ? `**ACTIVE MISSION:** Guide them to the truth of **${currentPillar.name}**.
- **TRUTH:** "${currentPillar.truth}"
- **VERSE:** ${currentPillar.verse}
- **CONTEXT:** ${currentPillar.description}
- **GOAL:** Ask a question that helps them realize this truth.`
        : `**ACTIVE MISSION:** Call 'getCurriculumContext' to find the next truth.`) 
    : getGenesisProtocol(onboardingStage);

  // 5. THE GREAT INJECTION
  let finalPrompt = masterTemplate
    .replace('{{PILLARS}}', pillarText)
    .replace('{{USER_PREFERENCES}}', userPrefsText)
    .replace('{{USER_NAME}}', userName)
    .replace('{{CURRENT_DOMAIN}}', currentDomain)
    .replace('{{PROGRESS}}', progress.toString())
    .replace('{{LAST_INSIGHT}}', lastInsight ? `- **Previous Anchor:** "${lastInsight}"` : '')
    .replace('{{LOCAL_TIME}}', localTime);

  // Inject Protocol at the end of the context section or append it
  // (We append it to ensure it overrides general instructions)
  return `${finalPrompt}\n\n### **CURRENT PROTOCOL**\n${protocol}`;
}

function getGenesisProtocol(stage: number): string {
  return `
- STAGE 0: Ask name.
- STAGE 1: Reveal Identity. Call 'illuminateDomains(["Identity"])'.
- STAGE 2: Reveal Purpose. Call 'illuminateDomains(["Purpose", "Action"])'.
- STAGE 3: Call 'advanceGenesis(4)' and 'updateUser(hasCompletedOnboarding=true)'.
`;
}
