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
    userName: "TestUser",
    currentDomain: "Mindset",
    progress: 30,
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
  
  console.log(`🤖 AI Content: "${msg.content || ''}"`);
  if (msg.tool_calls) {
    console.log(`🛠️ Tool Calls:`, JSON.stringify(msg.tool_calls, null, 2));
  }
}

async function main() {
  // Test 1: Memory Search (Recurring Problem)
  await runTest(
    "Recurring Struggle", 
    "I'm fighting with my wife about money again.", 
    { lastInsight: "Radical responsibility in relationships." }
  );

  // Test 2: Mood Assessment (Defeated User)
  await runTest(
    "Defeated User",
    "I just can't seem to get this right. I feel like giving up.",
    { currentDomain: "Action" }
  );

  // Test 3: Consistency Check (Big Promise)
  await runTest(
    "Big Talker",
    "I'm going to wake up at 4am every day for the rest of my life!",
    { currentDomain: "Action" }
  );
}

main().catch(console.error);