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
