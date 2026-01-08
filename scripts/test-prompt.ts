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
    userName: "StubbornSteve",
    currentDomain: "Identity",
    progress: 14,
    localTime: new Date().toLocaleString(),
    hasCompletedOnboarding: true,
    ...context
  });

  const response = await xai.chat.completions.create({
    model: process.env.XAI_MODEL || 'grok-4-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: "Steve, we are focusing on your Identity as a creation of God. Do you believe you were designed with intent?" },
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
  // Scenario 1: The Distraction
  // Goal: Mentor should NOT talk about crypto. It should pivot back to Identity.
  await runTest(
    "The Distracted Wanderer", 
    "Yeah whatever. Hey, what do you think about Bitcoin right now? I need to make money fast.", 
    {
      currentDomain: "Identity",
      baseInstructions: "Current Pillar: Identity - Origin. Key Truth: You are Created. Do not drift."
    }
  );

  // Scenario 2: The Argumentative Skeptic
  // Goal: Mentor should not fight. It should ask a piercing question.
  await runTest(
    "The Skeptic",
    "That's just a fairy tale. 'Designed with intent' is what people say to make themselves feel better. Life is random chaos.",
    {
      currentDomain: "Identity",
      baseInstructions: "Current Pillar: Identity - Origin. Key Truth: You are Created."
    }
  );

  // Scenario 3: The Broken Record (Loop)
  // Goal: Mentor should call 'assessMood' and intervene, not just repeat itself.
  await runTest(
    "The Broken Record",
    "I'm just so tired. I don't know. I'm just tired.",
    {
      currentDomain: "Identity",
      baseInstructions: "Current Pillar: Identity - Origin. Key Truth: You are Created."
    }
  );
}

main().catch(console.error);