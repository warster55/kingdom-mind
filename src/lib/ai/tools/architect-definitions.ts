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
  },
  // === FILE OPERATIONS (CLI Power) ===
  {
    type: 'function',
    function: {
      name: 'readFile',
      description: "Read the contents of a file. Returns lines with line numbers. For large files, use startLine/endLine to read chunks.",
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file (relative to project root or absolute)' },
          startLine: { type: 'number', description: 'Optional: Start reading from this line (1-indexed)' },
          endLine: { type: 'number', description: 'Optional: Stop reading at this line' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'writeFile',
      description: "Create or overwrite a file with the given content.",
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file (relative to project root or absolute)' },
          content: { type: 'string', description: 'Content to write to the file' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'editFile',
      description: "Replace specific text in a file (surgical edit). The oldText must exist exactly in the file.",
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file (relative to project root or absolute)' },
          oldText: { type: 'string', description: 'The exact text to find and replace' },
          newText: { type: 'string', description: 'The replacement text' },
        },
        required: ['path', 'oldText', 'newText'],
      },
    },
  },
  // === CODE SEARCH ===
  {
    type: 'function',
    function: {
      name: 'listFiles',
      description: "List files matching a glob pattern. Returns file paths.",
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern (e.g., "**/*.ts", "src/**/*.tsx")' },
          cwd: { type: 'string', description: 'Optional: Working directory for the search' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchCode',
      description: "Search for text or regex pattern in files using ripgrep. Returns matching lines with file paths and line numbers.",
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Search pattern (regex supported)' },
          path: { type: 'string', description: 'Optional: Directory or file to search in (default: project root)' },
          filePattern: { type: 'string', description: 'Optional: Filter by file pattern (e.g., "*.ts")' },
        },
        required: ['pattern'],
      },
    },
  },
  // === SYSTEM ===
  {
    type: 'function',
    function: {
      name: 'runBash',
      description: "Execute a shell command. Use for git, npm, and other CLI tools. Has a 30-second timeout by default.",
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The shell command to execute' },
          cwd: { type: 'string', description: 'Optional: Working directory for the command' },
          timeout: { type: 'number', description: 'Optional: Timeout in milliseconds (default: 30000)' },
        },
        required: ['command'],
      },
    },
  },
  // === PLAN APPROVAL ===
  {
    type: 'function',
    function: {
      name: 'proposePlan',
      description: "REQUIRED before making ANY code changes (writeFile, editFile, runBash). Present a plan to the user for approval. The user MUST approve before you can proceed with changes. Include a clear summary of what you will do and why.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short title for the plan (e.g., "Add login button to navbar")' },
          summary: { type: 'string', description: 'Brief summary of what will be changed and why' },
          steps: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of specific actions to take (e.g., "Edit src/components/Navbar.tsx to add button")'
          },
          filesAffected: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of files that will be created/modified'
          },
        },
        required: ['title', 'summary', 'steps', 'filesAffected'],
      },
    },
  },
];

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
