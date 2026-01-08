import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const mentorTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getUserStatus',
      description: "Retrieves the user's current transformation status across the 7 domains (Identity, Mindset, etc.). Call this to understand the user's current progress.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateProgress',
      description: "Records a breakthrough or progress in a specific transformation domain. Call this when the user shows growth or completes a domain reflection.",
      parameters: {
        type: 'object',
        properties: {
          domain: { 
            type: 'string', 
            enum: ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'],
            description: 'The domain being updated'
          },
          note: { type: 'string', description: 'A short summary of the progress or insight' }
        },
        required: ['domain', 'note'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clearSanctuary',
      description: "Archives the current chat session and starts a fresh one. Call this when the user requests to 'clear chat', 'start over', or 'reset session'.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ascendDomain',
      description: "Moves the user to the next domain in the 7-domain sequence. Call this when the user has achieved a major breakthrough in their current domain and is ready for the next level.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'peepTheGates',
      description: "Admin Only: Returns a list of users currently on the waitlist (pending approval).",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'approveUser',
      description: "Admin Only: Approves a user for entry into the sanctuary. Call this ONLY when an administrator requests to approve a specific email address.",
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'The email address of the user to approve' }
        },
        required: ['email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'seekWisdom',
      description: "Searches for contextually relevant Bible verses to support the user's current situation or breakthrough. Call this when you want to provide spiritual foundation for your guidance.",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The topic or theme to find scripture for (e.g. "peace during anxiety", "finding purpose")' }
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scribeReflection',
      description: "Summarizes the key breakthroughs and insights from the current session and saves them as a permanent reflection for the user. Call this at the end of a session or after a major breakthrough.",
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'A poetic and concise summary of the session breakthroughs' },
          domain: { type: 'string', description: 'The domain this reflection belongs to' }
        },
        required: ['summary', 'domain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'soulSearch',
      description: "Admin Only: Searches for a user by email and returns their journey summary, including active domain and progress.",
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'The email of the user to look up' }
        },
        required: ['email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'broadcast',
      description: "Admin Only: Sends a message or announcement to every approved user in the sanctuary. Use this for poetic nudges or system updates.",
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The announcement content' }
        },
        required: ['message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'setAtmosphere',
      description: "Adjusts the sanctuary environment. Can change the UI theme or the AI mentor's tone.",
      parameters: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark', 'stone'], description: 'The visual theme' },
          tone: { type: 'string', enum: ['Poetic', 'Direct', 'Gentle', 'Challenging'], description: 'The AI mentoring tone' }
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recallInsight',
      description: "Retrieves previous breakthroughs and insights the user has had in the sanctuary. Use this to remind them of their journey and past commitments.",
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Optional: Filter by specific domain' }
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'switchView',
      description: "Changes the user's perspective of the sanctuary. Call this when you want to show them the 'map' of their breakthroughs or bring them back to the 'chat' for conversation.",
      parameters: {
        type: 'object',
        properties: {
          view: { type: 'string', enum: ['chat', 'map'], description: 'The perspective to switch to' }
        },
        required: ['view'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'setHabit',
      description: "Creates a new 'Action Anchor' (habit) for the user. Call this when you want to anchor a mental breakthrough with a practical daily or weekly physical action.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'A short, powerful title for the habit (e.g. "Identity Affirmation")' },
          domain: { type: 'string', description: 'The domain this habit supports' },
          description: { type: 'string', description: 'The specific instructions for the habit' },
          frequency: { type: 'string', enum: ['daily', 'weekly'], description: 'How often the habit should be performed' }
        },
        required: ['title', 'domain', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'completeHabit',
      description: "Marks a specific habit as completed for today. Call this when the user reports that they have executed their action anchor.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The title of the habit being completed' }
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateUser',
      description: "Updates the user's profile information. Call this during onboarding when the user provides their name, or if they ask to change their name/details.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name the user wants to be called' },
          hasCompletedOnboarding: { type: 'boolean', description: 'Set to true when the user finishes the initiation ritual' }
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assessMood',
      description: "Analyzes the emotional tone of the user's input. Call this internally to calibrate your response tone (e.g., 'Defeated' -> Encouraging, 'Arrogant' -> Challenging).",
      parameters: {
        type: 'object',
        properties: {
          sentiment: { type: 'string', enum: ['Positive', 'Negative', 'Neutral', 'Anxious', 'Angry', 'Defeated', 'Hopeful'], description: 'The detected sentiment' }
        },
        required: ['sentiment'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'checkConsistency',
      description: "Checks the user's recent habit completion rate. Call this if the user is making big promises to see if their actions match their words.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generateParable',
      description: "Generates a custom, modern-day parable to illustrate a point. Call this when a direct explanation isn't landing.",
      parameters: {
        type: 'object',
        properties: {
          theme: { type: 'string', description: 'The moral or lesson of the parable' },
          context: { type: 'string', description: 'The user\'s current situation (e.g., "overwhelmed executive", "stuck artist")' }
        },
        required: ['theme', 'context'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchMemory',
      description: "Searches the user's entire history of insights and chats for specific keywords. Use this to find connections between current struggles and past events (e.g. 'wife', 'money', 'fear').",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The keyword or topic to search for in the memory banks' }
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCurriculumContext',
      description: "Retrieves the user's current position in the Spiral Curriculum (e.g., 'Identity: Origin'). Call this at the start of a deep session to know exactly what to teach.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'completePillar',
      description: "Marks the current curriculum pillar as COMPLETED and unlocks the next one. Call this ONLY when the user has demonstrated a clear breakthrough in the specific truth of the current pillar.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCheckoutSession',
      description: "Generates a subscription link. Call this ONLY if the user explicitly asks to subscribe or pay.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}
