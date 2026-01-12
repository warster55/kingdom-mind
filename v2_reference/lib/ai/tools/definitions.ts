import { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * MENTOR TOOLSET: The primary interface for AI-driven transformation.
 */
export const mentorTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'illuminateDomains',
      description: 'Lights up specific domains on the Sanctuary map. Call this background tool whenever you want to trigger visual resonance. Do not mention this in your text reply.',
      parameters: {
        type: 'object',
        properties: {
          domains: { 
            type: 'array', 
            items: { type: 'string', enum: ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'] },
            description: 'The list of domains to light up.'
          }
        },
        required: ['domains']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getUserStatus',
      description: 'Returns the seekers current domain, resonance levels, and curriculum progress.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scribeReflection',
      description: 'Permanently records a breakthrough or truth the seeker has realized. Call this when they acknowledge a lie or anchor a new divine truth.',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', enum: ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'] },
          summary: { type: 'string', description: 'A one-sentence anchor of the realization.' }
        },
        required: ['domain', 'summary']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'saveThought',
      description: 'Saves a raw thought or prayer for the seeker. Triggered by messages starting with - or direct request.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The text of the thought.' }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'advanceGenesis',
      description: 'Moves the seeker forward in the initial onboarding sequence.',
      parameters: {
        type: 'object',
        properties: {
          stage: { type: 'number', description: 'The new stage: 1=Identity, 2=Purpose, 3=Star, 4=Full' }
        },
        required: ['stage']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'updateUser',
      description: 'Updates seeker metadata like name or onboarding completion status.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          hasCompletedOnboarding: { type: 'boolean' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getCurriculumContext',
      description: 'Retrieves the specific Pillar of Truth the seeker is currently working on.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'completePillar',
      description: 'Marks the current curriculum pillar as completed and unlocks the next.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'resetJourney',
      description: 'Permanently erases ALL progress, insights, and history for this seeker.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deleteAccount',
      description: 'Permanently deletes the seekers entire identity and account.',
      parameters: { type: 'object', properties: {} }
    }
  }
];
