import { db } from '@/lib/db';
import { users, mentoringSessions, chatMessages, insights, habits, thoughts, userProgress, curriculum } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const BASE_PATH = './shiro_data';

async function processCSV(filePath: string, onRow: (row: any) => Promise<void>) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers: string[] = [];
  let isHeader = true;

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (isHeader) {
      headers = line.split(',').map(h => h.trim());
      isHeader = false;
      continue;
    }

    // Basic CSV parser that handles quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i+1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i]?.trim();
    });

    await onRow(obj);
  }
}

async function run() {
  console.log('🌌 Starting Shiro Soul Re-Import (Stream Mode)...');

  // 1. IMPORT USER
  console.log('Processing Users...');
  let newUserId = 15;
  await processCSV(path.join(BASE_PATH, 'user.csv'), async (userData) => {
    console.log(`Found Shiro: ${userData.email}`);
    const [shiro] = await db.insert(users).values({
      id: 15, 
      email: userData.email,
      name: userData.name,
      role: userData.role,
      isApproved: userData.is_approved === 't',
      currentDomain: userData.current_domain,
      timezone: userData.timezone,
      resonanceIdentity: parseInt(userData.resonance_identity || '0'),
      resonancePurpose: parseInt(userData.resonance_purpose || '0'),
      resonanceMindset: parseInt(userData.resonance_mindset || '0'),
      resonanceRelationships: parseInt(userData.resonance_relationships || '0'),
      resonanceVision: parseInt(userData.resonance_vision || '0'),
      resonanceAction: parseInt(userData.resonance_action || '0'),
      resonanceLegacy: parseInt(userData.resonance_legacy || '0'),
      onboardingStage: parseInt(userData.onboarding_stage || '0'),
      hasCompletedOnboarding: userData.has_completed_onboarding === 't',
    }).onConflictDoUpdate({
      target: users.email,
      set: { name: userData.name, role: userData.role }
    }).returning();
    newUserId = shiro.id;
    console.log(`✅ Shiro initialized at ID: ${newUserId}`);
  });

  // 2. IMPORT SESSIONS
  console.log('Processing Sessions...');
  const sessionMap = new Map<string, number>();
  await processCSV(path.join(BASE_PATH, 'sessions.csv'), async (row) => {
    if (row.user_id === '15') {
      const [s] = await db.insert(mentoringSessions).values({
        userId: newUserId,
        sessionNumber: parseInt(row.session_number),
        topic: row.topic,
        status: row.status,
        startedAt: new Date(row.startedAt || row.started_at),
      }).returning();
      sessionMap.set(row.id, s.id);
    }
  });
  console.log(`✅ ${sessionMap.size} sessions imported.`);

  // 3. IMPORT MESSAGES
  console.log('Processing Messages...');
  let msgCount = 0;
  await processCSV(path.join(BASE_PATH, 'messages.csv'), async (row) => {
    const newSessionId = sessionMap.get(row.session_id);
    if (newSessionId) {
      await db.insert(chatMessages).values({
        sessionId: newSessionId,
        role: row.role,
        content: row.content,
        telemetry: row.telemetry ? JSON.parse(row.telemetry) : null,
        createdAt: new Date(row.created_at),
      });
      msgCount++;
      if (msgCount % 100 === 0) process.stdout.write(`\rImported ${msgCount} messages...`);
    }
  });
  console.log(`\n✅ ${msgCount} messages imported.`);

  // 4. IMPORT INSIGHTS
  console.log('Processing Insights...');
  await processCSV(path.join(BASE_PATH, 'insights.csv'), async (row) => {
    if (row.user_id === '15') {
      await db.insert(insights).values({
        userId: newUserId,
        domain: row.domain,
        content: row.content,
        importance: parseInt(row.importance || '1'),
        createdAt: new Date(row.created_at),
      });
    }
  });
  console.log(`✅ Insights imported.`);

  // 5. IMPORT HABITS
  console.log('Processing Habits...');
  await processCSV(path.join(BASE_PATH, 'habits.csv'), async (row) => {
    if (row.user_id === '15') {
      await db.insert(habits).values({
        userId: newUserId,
        domain: row.domain,
        title: row.title,
        description: row.description,
        frequency: row.frequency,
        streak: parseInt(row.streak || '0'),
        isActive: row.is_active === 't',
        createdAt: new Date(row.created_at),
      });
    }
  });
  console.log(`✅ Habits imported.`);

  console.log('\n💎 Shiro Soul Re-Import Complete!');
}

run().catch(console.error);