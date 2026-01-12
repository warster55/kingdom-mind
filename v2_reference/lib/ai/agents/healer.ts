import { xai } from '../client';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const FORGE_ROOT = path.join(process.cwd(), 'forge');

// --- THE HEALER TOOLS ---

const healerTools = [
  {
    type: 'function',
    function: {
      name: 'writeTest',
      description: "Writes a Playwright test to the Forge to reproduce a bug.",
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'e.g., mobile-map-overlap.spec.ts' },
          code: { type: 'string', description: 'The full Playwright test code' }
        },
        required: ['filename', 'code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'runTest',
      description: "Runs a specific test in the Forge environment.",
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string' }
        },
        required: ['filename']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeFix',
      description: "Proposes a code change to fix the bug. (Does not apply it yet).",
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          explanation: { type: 'string' },
          diff: { type: 'string' }
        },
        required: ['filePath', 'explanation', 'diff']
      }
    }
  }
];

// --- THE HEALER LOGIC ---

export async function runHealerLoop(issueDescription: string) {
  const messages: any[] = [
    {
      role: 'system',
      content: `You are the Healer Agent. You operate inside 'The Forge', an isolated sandbox clone of the main app.
      
      YOUR MISSION:
      1. Analyze the issue description.
      2. Write a Playwright test to REPRODUCE the bug in the Forge (http://localhost:5000).
      3. Run the test to confirm it fails.
      4. If it fails, propose a fix.
      
      FORGE ENVIRONMENT:
      - URL: http://localhost:5000
      - DB: Isolated
      - Root: ./forge/
      
      TOOLS:
      - writeTest: Create a .spec.ts file in forge/tests/healing/
      - runTest: Execute that test.
      - proposeFix: Explain how to solve it.`
    },
    { role: 'user', content: `ISSUE REPORT: ${issueDescription}` }
  ];

  console.log(`[Healer] Starting diagnosis for: "${issueDescription}"`);

  // Simple 1-turn loop for MVP
  const response = await xai.chat.completions.create({
    model: process.env.XAI_MODEL || 'grok-4-latest',
    messages,
    tools: healerTools as any,
    tool_choice: 'auto'
  });

  const toolCalls = response.choices[0]?.message?.tool_calls;

  if (toolCalls) {
    for (const tc of toolCalls) {
      const name = tc.function.name;
      const args = JSON.parse(tc.function.arguments);

      if (name === 'writeTest') {
        console.log(`[Healer] Writing reproduction test: ${args.filename}`);
        const testPath = path.join(FORGE_ROOT, 'tests', 'healing', args.filename);
        
        // Ensure dir exists
        fs.mkdirSync(path.dirname(testPath), { recursive: true });
        fs.writeFileSync(testPath, args.code);
        
        return { status: 'test_written', path: testPath };
      }
    }
  }

  return { status: 'analysis_complete', response: response.choices[0]?.message?.content };
}
