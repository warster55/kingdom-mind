import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const architectTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'queryDatabase',
      description: "Execute a read-only SQL query to retrieve system data (users, progress, insights, etc.). Use this to answer the admin's questions about the system state.",
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'The SQL query to execute (read-only tables: users, insights, mentoring_sessions, chat_messages, system_prompts)' }
        },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateSystemPrompt',
      description: "Creates a new version of the Mentor's system prompt in the database. Use this to refine the Mentor's personality, tone, or rules based on admin feedback.",
      parameters: {
        type: 'object',
        properties: {
          newPrompt: { type: 'string', description: 'The full text of the updated system prompt' },
          explanation: { type: 'string', description: 'A short log of what was changed and why' }
        },
        required: ['newPrompt', 'explanation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSystemHealth',
      description: "Retrieves key system metrics (total users, active sessions today, waitlist count, database size).",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  }
];

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}
