import { rateLimit } from '@/lib/rate-limit';

async function audit() {
  console.log('⏳ Starting Rate Limit Audit...');
  const testKey = 'audit-user-123';
  
  let successCount = 0;
  let blocked = false;

  // Attempt to call 15 times (limit is 10)
  for (let i = 0; i < 15; i++) {
    const result = await rateLimit(testKey);
    console.log(`Call ${i+1}: ${result.success ? '✅ SUCCESS' : '❌ BLOCKED'} (Remaining: ${result.remaining})`);
    
    if (result.success) successCount++;
    else blocked = true;
  }

  if (successCount === 10 && blocked) {
    console.log('\n💎 Audit Passed: Rate limiter correctly blocked after 10 requests.');
  } else {
    console.log(`\n⚠️ Audit Failed: Unexpected behavior. Success count: ${successCount}, Blocked: ${blocked}`);
    process.exit(1);
  }
}

audit().catch(console.error);
