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
      name: 'approveUser',
      description: "Approves a user for entry into the sanctuary. Call this ONLY when an administrator (role: admin) requests to approve a specific email address.",
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