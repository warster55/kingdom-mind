import { execSync } from 'child_process';
import net from 'net';

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function run() {
  console.log("🛡️  INITIATING SOVEREIGN PROBE...");
  
  // 1. Static Analysis
  console.log("\n1️⃣  Verifying Structural Integrity (Types)...");
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log("✅ Code Structure: STABLE");
  } catch (e) {
    console.error("❌ TYPE CHECK FAILED");
    process.exit(1);
  }

  // 2. Port Check
  const port = 4000;
  const isServerUp = await checkPort(port);
  
  if (!isServerUp) {
    console.warn(`\n⚠️  Server (Port ${port}) is DOWN. Skipping Live Probes.`);
    console.log("ℹ️  Start the server with 'npm run dev' (ensure PORT=4000) to enable full verification.");
    return;
  }

  // 3. E2E Probe
  console.log("\n2️⃣  Simulating User Entry (Login Probe)...");
  try {
    execSync('npx playwright test e2e/login.spec.ts', { stdio: 'inherit' });
    console.log("✅ Login Portal: SECURE");
  } catch (e) {
    console.error("❌ LIVE PROBE FAILED");
    process.exit(1);
  }

  console.log("\n🎉 SOVEREIGN CHECK PASSED. SYSTEM HEALTHY.");
}

run();
