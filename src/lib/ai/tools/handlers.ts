import { db, users, userProgress, habits, insights, chatMessages, mentoringSessions, thoughts } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { mentorTools } from './definitions';

interface ToolResult {
  tool_name: string;
  parameters: any;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  is_public: boolean; // Can the user see this?
}

/**
 * AI TOOL HANDLERS
 * These are the server-side functions that the AI can call.
 * They perform actions and return results to the AI.
 */
export const toolHandlers = {
  // --- MENTOR TOOLSET ---

  illuminateDomains: async (userId: number, domains: string[]): Promise<ToolResult> => {
    // In v3, this is a client-side visual effect triggered by telemetry in the chat message
    // So, we just return success without actual database modification here.
    return {
      tool_name: 'illuminateDomains',
      parameters: { domains },
      status: 'success',
      data: { message: 'Domains illuminated on client.' },
      is_public: false,
    };
  },

  getUserStatus: async (userId: number): Promise<ToolResult> => {
    try {
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userResult[0];

      if (!user) {
        return { tool_name: 'getUserStatus', parameters: { userId }, status: 'error', error: 'User not found.', is_public: false };
      }

      // Fetch active habits (assuming 'domain' is a field in habits schema)
      const userHabits = await db.select().from(habits).where(eq(habits.userId, userId));

      // Fetch recent insights (assuming 'domain' is a field in insights schema)
      const userInsights = await db.select().from(insights).where(eq(insights.userId, userId)).orderBy(desc(insights.createdAt)).limit(5);

      return {
        tool_name: 'getUserStatus',
        parameters: { userId },
        status: 'success',
        data: {
          userName: user.name,
          currentDomain: user.currentDomain,
          onboardingStage: user.onboardingStage,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          resonance: {
            Identity: user.resonanceIdentity,
            Purpose: user.resonancePurpose,
            Mindset: user.resonanceMindset,
            Relationships: user.resonanceRelationships,
            Vision: user.resonanceVision,
            Action: user.resonanceAction,
            Legacy: user.resonanceLegacy,
          },
          habits: userHabits.map(h => ({ domain: h.domain, title: h.title, streak: h.streak })),
          recentInsights: userInsights.map(i => ({ domain: i.domain, content: decrypt(i.content) })), // Decrypt content
        },
        is_public: false,
      };
    } catch (e: any) {
      console.error("Error in getUserStatus:", e);
      return { tool_name: 'getUserStatus', parameters: { userId }, status: 'error', error: e.message, is_public: false };
    }
  },

  scribeReflection: async (userId: number, domain: string, summary: string): Promise<ToolResult> => {
    try {
      // Encrypt the insight before storing
      const encryptedSummary = encrypt(summary);
      await db.insert(insights).values({ userId, domain, content: encryptedSummary, importance: 1 });
      return { tool_name: 'scribeReflection', parameters: { userId, domain, summary }, status: 'success', data: { message: 'Reflection scribed.' }, is_public: true };
    } catch (e: any) {
      console.error("Error in scribeReflection:", e);
      return { tool_name: 'scribeReflection', parameters: { userId, domain, summary }, status: 'error', error: e.message, is_public: false };
    }
  },

  saveThought: async (userId: number, content: string): Promise<ToolResult> => {
    try {
      const encryptedContent = encrypt(content);
      await db.insert(thoughts).values({ userId, content: encryptedContent });
      return { tool_name: 'saveThought', parameters: { userId, content }, status: 'success', data: { message: 'Thought saved.' }, is_public: true };
    } catch (e: any) {
      console.error("Error in saveThought:", e);
      return { tool_name: 'saveThought', parameters: { userId, content }, status: 'error', error: e.message, is_public: false };
    }
  },

  advanceGenesis: async (userId: number, stage: number): Promise<ToolResult> => {
    try {
      await db.update(users).set({ onboardingStage: stage }).where(eq(users.id, userId));
      return { tool_name: 'advanceGenesis', parameters: { userId, stage }, status: 'success', data: { message: `Seeker advanced to stage ${stage}.` }, is_public: false };
    } catch (e: any) {
      console.error("Error in advanceGenesis:", e);
      return { tool_name: 'advanceGenesis', parameters: { userId, stage }, status: 'error', error: e.message, is_public: false };
    }
  },

  updateUser: async (userId: number, updates: { name?: string; hasCompletedOnboarding?: boolean }): Promise<ToolResult> => {
    try {
      await db.update(users).set(updates).where(eq(users.id, userId));
      return { tool_name: 'updateUser', parameters: { userId, updates }, status: 'success', data: { message: 'User updated.' }, is_public: false };
    } catch (e: any) {
      console.error("Error in updateUser:", e);
      return { tool_name: 'updateUser', parameters: { userId, updates }, status: 'error', error: e.message, is_public: false };
    }
  },

  getCurriculumContext: async (userId: number): Promise<ToolResult> => {
    // This is a placeholder. Real implementation would fetch current curriculum pillar from DB
    return {
      tool_name: 'getCurriculumContext',
      parameters: { userId },
      status: 'success',
      data: { name: "Identity", truth: "You are fearfully and wonderfully made." },
      is_public: false,
    };
  },

  completePillar: async (userId: number): Promise<ToolResult> => {
    // Placeholder for completing a pillar
    return {
      tool_name: 'completePillar',
      parameters: { userId },
      status: 'success',
      data: { message: 'Pillar completed (placeholder).' },
      is_public: false,
    };
  },

  resetJourney: async (userId: number): Promise<ToolResult> => {
    try {
      await db.delete(userProgress).where(eq(userProgress.userId, userId));
      await db.delete(habits).where(eq(habits.userId, userId));
      await db.delete(insights).where(eq(insights.userId, userId));
      await db.delete(chatMessages).where(eq(chatMessages.userId, userId)); // Assuming chatMessages has userId
      await db.delete(mentoringSessions).where(eq(mentoringSessions.userId, userId)); // Assuming mentoringSessions has userId
      await db.delete(thoughts).where(eq(thoughts.userId, userId));
      return { tool_name: 'resetJourney', parameters: { userId }, status: 'success', data: { message: 'User journey reset.' }, is_public: true };
    } catch (e: any) {
      console.error("Error in resetJourney:", e);
      return { tool_name: 'resetJourney', parameters: { userId }, status: 'error', error: e.message, is_public: false };
    }
  },

  deleteAccount: async (userId: number): Promise<ToolResult> => {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return { tool_name: 'deleteAccount', parameters: { userId }, status: 'success', data: { message: 'User account deleted.' }, is_public: true };
    } catch (e: any) {
      console.error("Error in deleteAccount:", e);
      return { tool_name: 'deleteAccount', parameters: { userId }, status: 'error', error: e.message, is_public: false };
    }
  },
};

/**
 * Executes an AI tool call.
 */
export async function executeTool(userId: number, toolCall: ChatCompletionTool): Promise<ToolResult> {
  const handler = (toolHandlers as any)[toolCall.function.name];
  if (!handler) {
    return { tool_name: toolCall.function.name, parameters: toolCall.function.arguments, status: 'error', error: 'Tool not found.', is_public: false };
  }
  const args = JSON.parse(toolCall.function.arguments || '{}');
  return handler(userId, ...Object.values(args));
}
