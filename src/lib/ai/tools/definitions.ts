import { tool } from 'ai';
import { z } from 'zod';

/**
 * MENTOR TOOLSET: Vercel AI SDK Format
 */
export const mentorTools = {
  illuminateDomains: tool({
    description: 'Lights up specific domains on the Sanctuary map. Call this background tool whenever you want to trigger visual resonance. Do not mention this in your text reply.',
    parameters: z.object({
      domains: z.array(z.enum(['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy']))
        .describe('The list of domains to light up.')
    }),
  }),

  getUserStatus: tool({
    description: 'Returns the seekers current domain, resonance levels, and curriculum progress.',
    parameters: z.object({}),
  }),

  scribeReflection: tool({
    description: 'Permanently records a breakthrough or truth the seeker has realized. Call this when they acknowledge a lie or anchor a new divine truth.',
    parameters: z.object({
      domain: z.enum(['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy']),
      summary: z.string().describe('A one-sentence anchor of the realization.')
    }),
  }),

  saveThought: tool({
    description: 'Saves a raw thought or prayer for the seeker. Triggered by messages starting with - or direct request.',
    parameters: z.object({
      content: z.string().describe('The text of the thought.')
    }),
  }),

  advanceGenesis: tool({
    description: 'Moves the seeker forward in the initial onboarding sequence.',
    parameters: z.object({
      stage: z.number().describe('The new stage: 1=Identity, 2=Purpose, 3=Star, 4=Full')
    }),
  }),

  updateUser: tool({
    description: 'Updates seeker metadata like name or onboarding completion status.',
    parameters: z.object({
      name: z.string().optional(),
      hasCompletedOnboarding: z.boolean().optional()
    }),
  }),

  getCurriculumContext: tool({
    description: 'Retrieves the specific Pillar of Truth the seeker is currently working on.',
    parameters: z.object({}),
  }),

  completePillar: tool({
    description: 'Marks the current curriculum pillar as completed and unlocks the next.',
    parameters: z.object({}),
  }),

  resetJourney: tool({
    description: 'Permanently erases ALL progress, insights, and history for this seeker.',
    parameters: z.object({}),
  }),

  deleteAccount: tool({
    description: 'Permanently deletes the seekers entire identity and account.',
    parameters: z.object({}),
  })
};
