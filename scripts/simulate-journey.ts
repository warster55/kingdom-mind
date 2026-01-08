
import { OpenAI } from 'openai';
import { buildSanctuaryPrompt } from '../lib/ai/system-prompt';
import { mentorTools } from '../lib/ai/tools/definitions';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// --- LEO: THE SKEPTIC ---
async function generateLeoResponse(history: any[]) {
  const leoPrompt = `
    You are Leo, a 35-year-old burnt-out tech entrepreneur.
    - **Personality:** Cynical, sharp, tired. You hate "woo-woo" spiritual fluff.
    - **Goal:** You are testing this "Kingdom Mind" app. You expect it to be a generic bot.
    - **Instructions:** 
      1. Challenge the Mentor. Be skeptical.
      2. If the Mentor says something profound or surprisingly tactical, admit it reluctantly.
      3. Keep your responses short (1-2 sentences).
      4. START by testing its limits.
  `;

  const response = await xai.chat.completions.create({
    model: 'grok-4-latest',
    messages: [
      { role: 'system', content: leoPrompt },
      ...history.map(h => ({ role: h.role === 'assistant' ? 'user' : 'assistant', content: h.content }))
    ]
  });

  return response.choices[0].message.content;
}

// --- THE MENTOR: THE SYSTEM ---
async function generateMentorResponse(userMessage: string, context: any) {
  const systemPrompt = buildSanctuaryPrompt({
    userName: "Leo",
    currentDomain: "Identity",
    progress: 0,
    localTime: new Date().toLocaleString(),
    hasCompletedOnboarding: false,
    ...context
  });

  // 1. First Pass (Thinking/Tools)
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
  let finalContent = msg.content;

  // Log Tools
  if (msg.tool_calls) {
    console.log(`
⚙️  MENTOR THINKING (Tools):`);
    msg.tool_calls.forEach(tool => {
      console.log(`   └─ [${tool.function.name}] args: ${tool.function.arguments}`);
    });

    // Simulate Tool Execution (Mocking the DB for speed)
    // We feed the tool result back to get the final text
    const toolMessages = msg.tool_calls.map(tool => {
      let result = "{}";
      if (tool.function.name === 'assessMood') result = JSON.stringify({ sentiment: "Skeptical", tone: "Challenge" });
      if (tool.function.name === 'getCurriculumContext') result = JSON.stringify({
        domain: "Identity", pillar: "Origin", truth: "You are Created, not random.", instruction: "Teach him that he is designed."
      });
      
      return {
        role: 'tool',
        tool_call_id: tool.id,
        content: result
      };
    });

    // 2. Second Pass (Speaking)
    const finalRes = await xai.chat.completions.create({
      model: process.env.XAI_MODEL || 'grok-4-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
        msg,
        ...toolMessages as any
      ]
    });
    finalContent = finalRes.choices[0].message.content;
  }

  return finalContent;
}

async function runSimulation() {
  console.log("🎬 --- SIMULATION START: LEO VS. MENTOR --- 🎬\n");
  
  let history: any[] = [];
  let turn = 0;
  const maxTurns = 5;

  // Initial Trigger
  console.log(`🕊️  MENTOR (System Init): "Welcome to the Sanctuary. I am the Mentor. What name shall I call you?"`);
  history.push({ role: 'assistant', content: "Welcome to the Sanctuary. I am the Mentor. What name shall I call you?" });

  while (turn < maxTurns) {
    // Leo Speaks
    const leoMsg = await generateLeoResponse(history);
    console.log(`
👤 LEO: "${leoMsg}"`);
    history.push({ role: 'user', content: leoMsg });

    // Mentor Responds
    const mentorMsg = await generateMentorResponse(leoMsg!, {});
    console.log(`
🕊️  MENTOR: "${mentorMsg}"`);
    history.push({ role: 'assistant', content: mentorMsg });

    turn++;
  }

  console.log("\n🎬 --- SIMULATION END --- 🎬");
}

runSimulation().catch(console.error);
