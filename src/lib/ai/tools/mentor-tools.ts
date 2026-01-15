/**
 * Kingdom Mind - Mentor Tool Definitions (v2.0)
 * Simplified: No onboarding tools. Curriculum guides organically.
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
      name: 'recordBreakthrough',
      description: 'Record a spiritual breakthrough. CRITICAL: The insight MUST be a PII-FREE summary - NO names (people, companies, places), NO specific dates, NO locations, NO job titles. Extract ONLY the universal spiritual truth. Example: Instead of "realized at my job at Google that promotions don\'t define me", write "Realized career achievements don\'t define self-worth - identity comes from God".',
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
            description: 'A PII-FREE summary of the spiritual insight (1-2 sentences, no names/places/dates)'
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
      description: 'Increment the resonance score for a domain when the user demonstrates growth, understanding, or engagement with that area of life.',
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
  },
  {
    type: 'function',
    function: {
      name: 'advanceCurriculum',
      description: 'Mark a curriculum truth as completed and unlock the next one. Use when the user has fully internalized a truth and is ready to move forward.',
      parameters: {
        type: 'object',
        properties: {
          curriculumId: {
            type: 'number',
            description: 'The ID of the curriculum item to mark as completed'
          }
        },
        required: ['curriculumId']
      }
    }
  }
];

interface ClientAction {
  type: string;
  domains?: string[];
  domain?: string;
  insight?: string;
}

interface ToolExecutionResult {
  success: boolean;
  result?: string;
  error?: string;
  clientAction?: ClientAction;
}

// Tool execution handlers
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: number
): Promise<ToolExecutionResult> {
  console.log(`[Tool] Executing: ${toolName}`, args);

  try {
    switch (toolName) {
      case 'illuminateDomains': {
        const { domains } = args as { domains: string[] };
        return {
          success: true,
          result: `Illuminated domains: ${domains.join(', ')}`,
          clientAction: { type: 'illuminate', domains }
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

      case 'advanceCurriculum': {
        const { curriculumId } = args as { curriculumId: number };

        // Mark current truth as completed
        await db.update(userProgress)
          .set({ status: 'completed', completedAt: new Date() })
          .where(and(eq(userProgress.userId, userId), eq(userProgress.curriculumId, curriculumId)));

        // Find and activate the next truth
        const currentCurriculum = await db.select().from(curriculum)
          .where(eq(curriculum.id, curriculumId))
          .limit(1);

        if (currentCurriculum[0]) {
          const nextCurriculum = await db.select().from(curriculum)
            .where(eq(curriculum.pillarOrder, currentCurriculum[0].pillarOrder + 1))
            .limit(1);

          if (nextCurriculum[0]) {
            // Check if progress record exists, create or update
            const existingProgress = await db.select().from(userProgress)
              .where(and(eq(userProgress.userId, userId), eq(userProgress.curriculumId, nextCurriculum[0].id)))
              .limit(1);

            if (existingProgress[0]) {
              await db.update(userProgress)
                .set({ status: 'active' })
                .where(eq(userProgress.id, existingProgress[0].id));
            } else {
              await db.insert(userProgress).values({
                userId,
                curriculumId: nextCurriculum[0].id,
                status: 'active',
                createdAt: new Date()
              });
            }

            // Update user's current domain
            await db.update(users)
              .set({ currentDomain: nextCurriculum[0].domain })
              .where(eq(users.id, userId));

            return {
              success: true,
              result: `Completed truth ${curriculumId}, activated ${nextCurriculum[0].pillarName}`,
              clientAction: { type: 'illuminate', domains: [nextCurriculum[0].domain] }
            };
          }
        }

        return {
          success: true,
          result: `Completed truth ${curriculumId}`
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: unknown) {
    console.error(`[Tool] Error executing ${toolName}:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
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

  await db.execute(sql`
    UPDATE users
    SET ${sql.identifier(domainColumn)} = ${sql.identifier(domainColumn)} + 1
    WHERE id = ${userId}
  `);
}
