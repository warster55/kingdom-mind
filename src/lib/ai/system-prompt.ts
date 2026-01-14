import { db, sacredPillars, systemPrompts, users } from '@/lib/db';
import { asc, desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm'; // Import sql for potential use in appConfig's onConflictDoUpdate

/**
 * Kingdom Mind - The Sovereign Template Engine (v7.0)
 * DATABASE-DRIVEN FLUIDITY + PRIVACY-FIRST USER CONTEXT
 *
 * PRIVACY PRINCIPLE: User insight CONTENT never leaves the server.
 * Only metadata (domain, timestamp, counts) is sent to external AI.
 */

export interface PromptContext {
  userName: string;
  userId?: number;
  currentDomain: string;
  progress: number;
  localTime: string;
  hasCompletedOnboarding: boolean;
  onboardingStage: number;
  currentPillar?: { name: string; truth: string; verse: string; description: string };

  // Privacy-First Memory (v7.0) - Metadata only, NO content
  insightMetadata?: Array<{ domain: string; createdAt: Date }>;  // No content field
  resonanceScores?: Record<string, number>;
  completedCurriculumStats?: Record<string, number>;  // Domain -> count, no truth content
  daysSinceJoined?: number;
  onboardingEnabled?: boolean;
}

export async function buildSanctuaryPrompt(context: PromptContext): Promise<string> {
  const {
    userName, currentDomain, progress, localTime,
    hasCompletedOnboarding, onboardingStage, currentPillar,
    insightMetadata, resonanceScores, completedCurriculumStats, daysSinceJoined,
    onboardingEnabled
  } = context;

  // 1. Fetch The Master Prompt
  const promptRecord = await db.select().from(systemPrompts)
    .where(eq(systemPrompts.isActive, true))
    .orderBy(desc(systemPrompts.version))
    .limit(1);

  const masterTemplate = promptRecord[0]?.content || "ERROR: System Prompt Missing. Contact Architect.";

  // 2. Fetch The Eternal Truths
  const pillars = await db.select().from(sacredPillars).orderBy(asc(sacredPillars.order));
  const pillarText = pillars.map((p, i) => `${i+1}. ${p.content}`).join('\n');

  // 3. Build User Memory Section (Privacy-First: Metadata Only)
  let userMemoryText = buildUserMemory({ insightMetadata, resonanceScores, completedCurriculumStats, daysSinceJoined });

  // 4. Determine Dynamic Protocol
  let protocol: string;
  if (onboardingEnabled && !hasCompletedOnboarding) {
    protocol = getGenesisProtocol(onboardingStage);
  } else if (currentPillar) {
    protocol = `**ACTIVE MISSION:** Guide them to the truth of **${currentPillar.name}**.
- **TRUTH:** "${currentPillar.truth}"
- **VERSE:** ${currentPillar.verse}
- **CONTEXT:** ${currentPillar.description}
- **GOAL:** Ask a question that helps them realize this truth.`;
  } else {
    protocol = `**ACTIVE MISSION:** Have a natural conversation. The curriculum will guide them organically.`;
  }

  // 5. THE GREAT INJECTION
  // PRIVACY: No insight content is injected - only metadata summaries
  let finalPrompt = masterTemplate
    .replace('{{PILLARS}}', pillarText)
    .replace('{{USER_PREFERENCES}}', userMemoryText)
    .replace('{{USER_NAME}}', userName)
    .replace('{{CURRENT_DOMAIN}}', currentDomain)
    .replace('{{PROGRESS}}', progress.toString())
    .replace('{{LAST_INSIGHT}}', '')  // PRIVACY: Removed - insight content stays on server
    .replace('{{LOCAL_TIME}}', localTime);

  // Inject Protocol at the end
  return `${finalPrompt}\n\n### **CURRENT PROTOCOL**\n${protocol}`;
}

/**
 * Builds the User Memory section from METADATA ONLY.
 * PRIVACY: No insight content is included - only domain, timestamps, and counts.
 * This protects user PII while still giving the AI useful context.
 */
function buildUserMemory(data: {
  insightMetadata?: Array<{ domain: string; createdAt: Date }>;
  resonanceScores?: Record<string, number>;
  completedCurriculumStats?: Record<string, number>;
  daysSinceJoined?: number;
}): string {
  const sections: string[] = [];

  // Journey Duration
  if (data.daysSinceJoined !== undefined) {
    if (data.daysSinceJoined === 0) {
      sections.push("- **Journey:** This is their FIRST day in the Sanctuary. Welcome them warmly.");
    } else if (data.daysSinceJoined < 7) {
      sections.push(`- **Journey:** ${data.daysSinceJoined} days in the Sanctuary (new seeker)`);
    } else {
      sections.push(`- **Journey:** ${data.daysSinceJoined} days in the Sanctuary`);
    }
  }

  // Resonance Scores (The 7 Domains)
  if (data.resonanceScores) {
    const sortedDomains = Object.entries(data.resonanceScores)
      .sort(([, a], [, b]) => b - a);

    const strongest = sortedDomains.filter(([, v]) => v > 0).slice(0, 2);
    const weakest = sortedDomains.filter(([, v]) => v === 0 || v < 3).slice(-2);

    if (strongest.length > 0) {
      sections.push(`- **Strong Domains:** ${strongest.map(([k, v]) => `${k} (${v})`).join(', ')}`);
    }
    if (weakest.length > 0 && weakest.some(([, v]) => v < 3)) {
      sections.push(`- **Growth Areas:** ${weakest.map(([k]) => k).join(', ')}`);
    }
  }

  // Breakthrough Summary (METADATA ONLY - no content)
  if (data.insightMetadata && data.insightMetadata.length > 0) {
    // Count breakthroughs by domain
    const domainCounts: Record<string, number> = {};
    let mostRecent: Date | null = null;

    for (const insight of data.insightMetadata) {
      domainCounts[insight.domain] = (domainCounts[insight.domain] || 0) + 1;
      if (!mostRecent || new Date(insight.createdAt) > mostRecent) {
        mostRecent = new Date(insight.createdAt);
      }
    }

    const totalBreakthroughs = data.insightMetadata.length;
    const domainSummary = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([domain, count]) => `${domain}: ${count}`)
      .join(', ');

    let recentLabel = '';
    if (mostRecent) {
      const daysAgo = Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
      recentLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`;
    }

    sections.push(`- **Breakthroughs:** ${totalBreakthroughs} total (${domainSummary}), most recent: ${recentLabel}`);
  }

  // Completed Curriculum Summary (COUNTS ONLY - no truth content)
  if (data.completedCurriculumStats && Object.keys(data.completedCurriculumStats).length > 0) {
    const total = Object.values(data.completedCurriculumStats).reduce((a, b) => a + b, 0);
    const summary = Object.entries(data.completedCurriculumStats)
      .map(([domain, count]) => `${domain}: ${count}`)
      .join(', ');
    sections.push(`- **Curriculum Progress:** ${total} truths completed (${summary})`);
  }

  return sections.length > 0 ? sections.join('\n') : "Standard Mentor Mode.";
}

function getGenesisProtocol(stage: number): string {
  return `
**GENESIS PROTOCOL (Onboarding Journey)**
You have access to tools to guide the user's journey. Use them appropriately:

- **STAGE 0** (Current: ${stage === 0 ? 'YES' : 'no'}): Ask for their name warmly.
- **STAGE 1** (Current: ${stage === 1 ? 'YES' : 'no'}): Reveal their Identity as a child of God. Use the \`illuminateDomains\` tool with ["Identity"]. Then use \`advanceGenesis\` to move to stage 2.
- **STAGE 2** (Current: ${stage === 2 ? 'YES' : 'no'}): Reveal their Purpose and call to Action. Use the \`illuminateDomains\` tool with ["Purpose", "Action"]. Then use \`advanceGenesis\` to move to stage 3.
- **STAGE 3** (Current: ${stage === 3 ? 'YES' : 'no'}): Complete onboarding. Use the \`completeOnboarding\` tool to finish their Genesis journey.

When the user has a breakthrough or significant realization, use the \`recordBreakthrough\` tool to save it.
When they demonstrate growth in a domain, use \`incrementResonance\` to track their progress.
`;
}
