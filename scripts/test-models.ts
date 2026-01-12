import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

async function testModel(name: string, modelId: string) {
  console.log(`\nTesting ${name} (${modelId})...`);
  const t0 = Date.now();
  try {
    const response = await xai.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: 'Say "Ready" if you can hear me.' }],
      max_tokens: 10,
    });
    const t1 = Date.now();
    console.log(`✅ SUCCESS: ${name} responded in ${t1 - t0}ms`);
    console.log(`   Output: "${response.choices[0].message.content}"`);
    return true;
  } catch (error: any) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function run() {
  console.log('🔌 xAI Model Connectivity Test');
  console.log('------------------------------');

  const architectSuccess = await testModel('ARCHITECT', 'grok-4-1-fast-reasoning');
  const mentorSuccess = await testModel('MENTOR', 'grok-4-1-fast-non-reasoning');

  console.log('\n------------------------------');
  if (architectSuccess && mentorSuccess) {
    console.log('🎉 BOTH MODELS OPERATIONAL');
  } else {
    console.log('⚠️  ISSUES DETECTED');
  }
}

run();
