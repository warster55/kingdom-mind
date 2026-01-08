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
    userName: "Leo",
    currentDomain: "Action",
    progress: 80,
    localTime: new Date().toLocaleString(),
    hasCompletedOnboarding: true,
    ...context
  });

  // 1. First Pass (Decision)
  const runner = await xai.chat.completions.create({
    model: process.env.XAI_MODEL || 'grok-4-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    tools: mentorTools,
    tool_choice: 'auto',
  });

  const msg = runner.choices[0].message;
  
  if (msg.tool_calls) {
    console.log(`🛠️ Tool Calls:`, JSON.stringify(msg.tool_calls, null, 2));
    
    // Check if generateParable was called
    const parableCall = msg.tool_calls.find(t => t.function.name === 'generateParable');
    
    if (parableCall) {
      console.log("✅ PARABLE ENGINE TRIGGERED.");
      
      // Simulate the System Injection
      const toolMsg = {
        role: 'tool',
        tool_call_id: parableCall.id,
        content: JSON.stringify({ 
          action: 'GENERATE_STORY', 
          instruction: `[SYSTEM OVERRIDE: PARABLE MODE] Write a short parable about "${JSON.parse(parableCall.function.arguments).theme}".` 
        })
      };

      // 2. Second Pass (The Story)
      const storyRes = await xai.chat.completions.create({
        model: process.env.XAI_MODEL || 'grok-4-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
          msg,
          toolMsg as any
        ]
      });
      
      console.log(`📖 MENTOR STORY: "${storyRes.choices[0].message.content}"`);
    }
  } else {
    console.log(`🤖 AI Response (No Parable): "${msg.content}"`);
  }
}

async function main() {
  // Scenario: The Hustler who refuses to rest
  await runTest(
    "The Parable Trigger", 
    "I can't stop working. If I stop, I lose momentum. Rest is for people who haven't made it yet.", 
    {
      currentDomain: "Action",
      baseInstructions: "Current Pillar: Action - The Recovery. Key Truth: Rest is a Weapon."
    }
  );
}

main().catch(console.error);
