import { db, users, userProgress, habits, insights, chatMessages, mentoringSessions, thoughts } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import { ToolResult } from './definitions';
import { encrypt, decrypt } from '@/lib/utils/encryption';

// --- SANCTUARY PHYSICS TOOLS ---

/**
 * Lights up specific domains on the map without adding text to the chat.
 */
export async function executeIlluminateDomains(userId: string, domains: string[]): Promise<ToolResult> {
  try {
    const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];
    const id = parseInt(userId);
    
    for (const domain of domains) {
      const normalizedDomain = DOMAINS.find(d => d.toLowerCase() === domain.toLowerCase());
      if (normalizedDomain) {
        const column = `resonance${normalizedDomain}` as any;
        await db.update(users).set({ [column]: sql`${users[column]} + 1` }).where(eq(users.id, id));
      }
    }
    
    return { success: true, data: { status: 'illuminated', domains } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- GENESIS FAST-TRACK TOOLS ---

export async function executeGenesisStep1(userId: string, name: string): Promise<ToolResult> {
  try {
    await db.update(users)
      .set({ 
        name, 
        onboardingStage: 1, 
        hasCompletedOnboarding: false 
      })
      .where(eq(users.id, parseInt(userId)));
    return { success: true, data: { status: 'genesis_step_1_complete', stage: 1 } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGenesisStep2(userId: string): Promise<ToolResult> {
  try {
    await db.update(users).set({ onboardingStage: 2 }).where(eq(users.id, parseInt(userId)));
    return { success: true, data: { status: 'genesis_step_2_complete', stage: 2 } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGenesisStep3(userId: string): Promise<ToolResult> {
  try {
    await db.update(users).set({ onboardingStage: 3 }).where(eq(users.id, parseInt(userId)));
    return { success: true, data: { status: 'genesis_step_3_complete', stage: 3 } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGenesisComplete(userId: string): Promise<ToolResult> {
  try {
    await db.update(users)
      .set({ 
        onboardingStage: 4, 
        hasCompletedOnboarding: true 
      })
      .where(eq(users.id, parseInt(userId)));
    return { success: true, data: { status: 'genesis_complete', stage: 4 } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- DATA SOVEREIGNTY TOOLS ---

export async function executeDeleteAccount(userId: string): Promise<ToolResult> {
  try {
    await db.delete(users).where(eq(users.id, parseInt(userId)));
    return { success: true, data: { status: 'account_deleted', message: 'User account and all associated data have been permanently removed.' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeResetJourney(userId: string): Promise<ToolResult> {
  try {
    const id = parseInt(userId);
    // Wipe progress, habits, insights, and reset resonance
    await db.delete(userProgress).where(eq(userProgress.userId, id));
    await db.delete(habits).where(eq(habits.userId, id));
    await db.delete(insights).where(eq(insights.userId, id));
    await db.delete(thoughts).where(eq(thoughts.userId, id));
    
    await db.update(users).set({
      resonanceIdentity: 0, resonancePurpose: 0, resonanceMindset: 0,
      resonanceRelationships: 0, resonanceVision: 0, resonanceAction: 0, resonanceLegacy: 0,
      currentDomain: 'Identity',
      onboardingStage: 0,
      hasCompletedOnboarding: false
    }).where(eq(users.id, id));

    return { success: true, data: { status: 'journey_reset', message: 'All progress has been wiped. The Sanctuary is fresh.' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- LIFE OS TOOLS ---

export async function executeSaveThought(userId: string, content: string): Promise<ToolResult> {
  try {
    await db.insert(thoughts).values({
      userId: parseInt(userId),
      content: encrypt(content),
      isProcessed: true
    });
    return { success: true, data: { status: 'thought_captured' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGenerateLifeSummary(userId: string, timeframe: string): Promise<ToolResult> {
  try {
    const id = parseInt(userId);
    
    const userInsights = await db.select().from(insights).where(eq(insights.userId, id)).orderBy(desc(insights.createdAt)).limit(10);
    const userHabits = await db.select().from(habits).where(eq(habits.userId, id));
    const userThoughts = await db.select().from(thoughts).where(eq(thoughts.userId, id)).orderBy(desc(thoughts.createdAt)).limit(10);
    const userData = await db.select().from(users).where(eq(users.id, id));

    return {
      success: true,
      data: {
        summary: {
          resonance: userData[0],
          recentInsights: userInsights.map(i => decrypt(i.content)),
          activeHabits: userHabits.map(h => h.title),
          recentThoughts: userThoughts.map(t => decrypt(t.content))
        }
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeUserStatus(userId: string): Promise<ToolResult> {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    const user = userResult[0];
    if (!user) return { success: false, error: 'User not found' };

    const progress = await db.select().from(userProgress).where(eq(userProgress.userId, user.id));

    return {
      success: true,
      data: {
        name: user.name,
        activeDomain: user.currentDomain,
        onboardingStage: user.onboardingStage,
        role: user.role,
        resonance: {
          Identity: user.resonanceIdentity,
          Purpose: user.resonancePurpose,
          Mindset: user.resonanceMindset,
          Relationships: user.resonanceRelationships,
          Vision: user.resonanceVision,
          Action: user.resonanceAction,
          Legacy: user.resonanceLegacy,
        },
        curriculum: progress.map(p => ({ id: p.curriculumId, status: p.status, level: p.level }))
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeUpdateProgress(userId: string, domain: string, note: string): Promise<ToolResult> {
  return { success: true, data: { status: 'updated', domain } };
}

export async function executeApproveUser(adminId: string, emailToApprove: string): Promise<ToolResult> {
  try {
    await db.update(users).set({ isApproved: true }).where(eq(users.email, emailToApprove));
    return { success: true, data: { status: 'approved', email: emailToApprove } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeClearSanctuary(sessionId: number): Promise<ToolResult> {
  try {
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
    return { success: true, data: { status: 'cleared' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeAscendDomain(userId: string): Promise<ToolResult> {
  return { success: true, data: { status: 'ascended' } };
}

export async function executePeepTheGates(userId: string): Promise<ToolResult> {
  return { success: true, data: { status: 'checked' } };
}

export async function executeSeekWisdom(query: string): Promise<ToolResult> {
  return { success: true, data: { answer: "Wisdom found." } };
}

export async function executeScribeReflection(userId: string, sessionId: number, domain: string, summary: string): Promise<ToolResult> {
  try {
    await db.insert(insights).values({
      userId: parseInt(userId),
      sessionId,
      domain,
      content: encrypt(summary),
      importance: 1
    });
    return { success: true, data: { status: 'scribed' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeSoulSearch(userId: string, email: string): Promise<ToolResult> {
  return { success: true, data: { found: true } };
}

export async function executeBroadcast(userId: string, message: string): Promise<ToolResult> {
  return { success: true, data: { sent: true } };
}

export async function executeSetAtmosphere(theme: string, tone: string): Promise<ToolResult> {
  return { success: true, data: { atmosphere: `${theme} - ${tone}` } };
}

export async function executeRecallInsight(userId: string, domain: string): Promise<ToolResult> {
  return { success: true, data: { insight: "You realized your worth." } };
}

export async function executeSetHabit(userId: string, title: string, domain: string, description: string, frequency: string): Promise<ToolResult> {
  try {
    await db.insert(habits).values({
      userId: parseInt(userId),
      domain,
      title,
      description,
      frequency
    });
    return { success: true, data: { status: 'habit_set' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeCompleteHabit(userId: string, title: string): Promise<ToolResult> {
  return { success: true, data: { status: 'habit_completed' } };
}

export async function executeSwitchView(view: string): Promise<ToolResult> {
  return { success: true, data: { view } };
}

export async function executeUpdateUser(userId: string, name: string, hasCompletedOnboarding: boolean): Promise<ToolResult> {
  try {
    await db.update(users).set({ name, hasCompletedOnboarding }).where(eq(users.id, parseInt(userId)));
    return { success: true, data: { status: 'updated' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeAssessMood(sentiment: string): Promise<ToolResult> {
  return { success: true, data: { recorded: true } };
}

export async function executeCheckConsistency(userId: string): Promise<ToolResult> {
  return { success: true, data: { consistent: true } };
}

export async function executeGenerateParable(theme: string, context: string): Promise<ToolResult> {
  return { success: true, data: { parable: "Once upon a time..." } };
}

export async function executeSearchMemory(userId: string, query: string): Promise<ToolResult> {
  return { success: true, data: { results: [] } };
}

export async function executeGetCurriculumContext(userId: string): Promise<ToolResult> {
  return { success: true, data: { context: "Identity Pillar 1" } };
}

export async function executeCompletePillar(userId: string): Promise<ToolResult> {
  return { success: true, data: { status: 'pillar_completed' } };
}

export async function executeAdvanceGenesis(userId: string, stage: number): Promise<ToolResult> {
  return { success: true, data: { status: 'deprecated', stage } }; 
}