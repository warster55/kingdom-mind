/**
 * Kingdom Mind - Mentor Tool Definitions
 * Real AI tools that replace text-based function calls
 */
import OpenAI from 'openai';
import { db, users, userProgress, curriculum, insights } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { encrypt } from '@/lib/utils/encryption';

// Tool definitions for the OpenAI-compatible API
export const mentorTools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'illuminateDomains',
      description: 'Illuminate (light up) domain stars on the user interface to visually show spiritual progress. Use this when revealing truths about a domain or celebrating growth in an area.',
      parameters: {
        type: 'object',
        properties: {
          domains: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy']
            },
            description: 'The spiritual domains to illuminate'
          }
        },
        required: ['domains']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'advanceGenesis',
      description: 'Advance the user to the next stage of their onboarding journey (Genesis Protocol). Only use during initial onboarding.',
      parameters: {
        type: 'object',
        properties: {
          stage: {
            type: 'number',
            description: 'The stage number to advance to (1-4)'
          }
        },
        required: ['stage']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'completeOnboarding',
      description: 'Mark the user as having completed their onboarding journey. Use when Genesis Protocol is complete.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recordBreakthrough',
      description: 'Record a spiritual breakthrough or insight the user has achieved. Use when the user has a significant realization or commits to transformation.',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            enum: ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'],
            description: 'The domain this breakthrough relates to'
          },
          insight: {
            type: 'string',
            description: 'A brief summary of the breakthrough or insight'
          }
        },
        required: ['domain', 'insight']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'incrementResonance',
      description: 'Increment the resonance score for a domain when the user demonstrates growth or understanding.',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            enum: ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'],
            description: 'The domain to increment resonance for'
          }
        },
        required: ['domain']
      }
    }
  }
];

// Tool execution handlers
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  userId: number
): Promise<{ success: boolean; result?: any; error?: string; clientAction?: any }> {
  console.log(`[Tool] Executing: ${toolName}`, args);

  try {
    switch (toolName) {
      case 'illuminateDomains': {
        const { domains } = args as { domains: string[] };
        // This is a client-side action - we return data for the client to handle
        return {
          success: true,
          result: `Illuminated domains: ${domains.join(', ')}`,
          clientAction: { type: 'illuminate', domains }
        };
      }

      case 'advanceGenesis': {
        const { stage } = args as { stage: number };
        await db.update(users)
          .set({ onboardingStage: stage })
          .where(eq(users.id, userId));
        return {
          success: true,
          result: `Advanced to Genesis stage ${stage}`
        };
      }

      case 'completeOnboarding': {
        await db.update(users)
          .set({ hasCompletedOnboarding: true, onboardingStage: 4 })
          .where(eq(users.id, userId));
        return {
          success: true,
          result: 'Onboarding completed'
        };
      }

      case 'recordBreakthrough': {
        const { domain, insight } = args as { domain: string; insight: string };
        await db.insert(insights).values({
          userId,
          domain,
          content: encrypt(insight),
          importance: 1,
          createdAt: new Date()
        });
        // Also increment resonance for this domain
        await incrementDomainResonance(userId, domain);
        return {
          success: true,
          result: `Breakthrough recorded in ${domain}`,
          clientAction: { type: 'breakthrough', domain, insight }
        };
      }

      case 'incrementResonance': {
        const { domain } = args as { domain: string };
        await incrementDomainResonance(userId, domain);
        return {
          success: true,
          result: `Resonance incremented for ${domain}`,
          clientAction: { type: 'illuminate', domains: [domain] }
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`[Tool] Error executing ${toolName}:`, error);
    return { success: false, error: error.message };
  }
}

async function incrementDomainResonance(userId: number, domain: string): Promise<void> {
  const domainColumn = {
    'Identity': 'resonanceIdentity',
    'Purpose': 'resonancePurpose',
    'Mindset': 'resonanceMindset',
    'Relationships': 'resonanceRelationships',
    'Vision': 'resonanceVision',
    'Action': 'resonanceAction',
    'Legacy': 'resonanceLegacy'
  }[domain];

  if (!domainColumn) return;

  // Use raw SQL for dynamic column update
  await db.execute(sql`
    UPDATE users
    SET ${sql.identifier(domainColumn)} = ${sql.identifier(domainColumn)} + 1
    WHERE id = ${userId}
  `);
}
