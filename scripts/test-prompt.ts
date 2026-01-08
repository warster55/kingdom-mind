import { OpenAI } from 'openai';
import { buildSanctuaryPrompt } from '../lib/ai/system-prompt';
import { mentorTools } from '../lib/ai/tools/definitions';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

async function runTest(scenario: string, userMessage: string, context: any) {
  console.log(`\n🧪 TESTING SCENARIO: ${scenario}`);
  console.log(`👤 User: "${userMessage}"`);
  
  const systemPrompt = buildSanctuaryPrompt({
    userName: "Seeker",
    currentDomain: "Mindset",
    progress: 40,
    localTime: new Date().toLocaleString(),
    hasCompletedOnboarding: true,
    ...context
  });

  const response = await xai.chat.completions.create({
    model: process.env.XAI_MODEL || 'grok-4-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    tools: mentorTools,
    tool_choice: 'auto',
  });

  const msg = response.choices[0].message;
  console.log(`🕊️ Mentor: "${msg.content || '(Tool Call)'}"`);
}

async function main() {
  // Scenario: User is vague. Mentor should DIG, not advise.
  await runTest(
    "The Vague Complaint", 
    "I just feel stuck. I don't know why.", 
    {
      currentDomain: "Mindset",
      baseInstructions: "Current Pillar: Mindset - Awareness. Key Truth: You are the Thinker. GOAL: Ask a piercing question to reveal the root thought."
    }
  );
}

main().catch(console.error);