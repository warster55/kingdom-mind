
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { mentorTools } from '../lib/ai/tools/definitions';

dotenv.config({ path: '.env.local' });

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

async function measure(name: string, fn: () => Promise<any>) {
  const start = Date.now();
  await fn();
  const end = Date.now();
  console.log(`⏱️  [${name}]: ${(end - start) / 1000}s`);
}

async function runBenchmark() {
  console.log("🏁 STARTING LATENCY BENCHMARK\n");

  // 1. RAW SPEED (No Tools)
  await measure("Raw Response (No Tools)", async () => {
    await xai.chat.completions.create({
      model: 'grok-4-latest',
      messages: [{ role: 'user', content: 'Say "Ready".' }],
    });
  });

  // 2. CURRENT SYSTEM (Tool Chaining)
  await measure("Current Multi-Hop (Thinking Phase)", async () => {
    // Phase 1: Tool Call
    const res1 = await xai.chat.completions.create({
      model: 'grok-4-latest',
      messages: [{ role: 'system', content: 'You must call getCurriculumContext and assessMood before replying.' }, { role: 'user', content: 'I am stuck.' }],
      tools: mentorTools,
      tool_choice: 'required'
    });
    
    const msg = res1.choices[0].message;
    
    // Phase 2: Feeding results back (Simulated)
    const toolMsgs = msg.tool_calls?.map(t => ({
      role: 'tool',
      tool_call_id: t.id,
      content: JSON.stringify({ success: true, data: "Mocked Data" })
    }));

    // Phase 3: Final Answer
    await xai.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        { role: 'system', content: 'You must call getCurriculumContext and assessMood before replying.' },
        { role: 'user', content: 'I am stuck.' },
        msg,
        ...toolMsgs as any
      ]
    });
  });

  // 3. OPTIMIZED SYSTEM (Pre-Fetched Context)
  await measure("Optimized Single-Hop (Prefetched)", async () => {
    await xai.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        { role: 'system', content: 'Context: Warren is in Identity: Origin. Mood: Distressed.' }, 
        { role: 'user', content: 'I am stuck.' }
      ],
    });
  });

  console.log("\n✅ BENCHMARK COMPLETE");
}

runBenchmark().catch(console.error);
