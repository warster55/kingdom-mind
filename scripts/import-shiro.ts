import { db } from '@/lib/db';
import { users, mentoringSessions, chatMessages, insights, habits, thoughts, userProgress, curriculum } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const BASE_PATH = './shiro_data';

function parseCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(l => l.trim()).map(line => {
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
      obj[h.trim()] = values[i]?.trim();
    });
    return obj;
  });
}

async function run() {
  console.log('🌌 Starting Shiro Soul Re-Import...');

  // 1. IMPORT USER
  const userData = parseCSV(path.join(BASE_PATH, 'user.csv'))[0];
  console.log(`Found Shiro: ${userData.email}`);

  // Upsert user
  const [shiro] = await db.insert(users).values({
    id: 15, // Try to force ID 15
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

  const newUserId = shiro.id;
  console.log(`✅ Shiro initialized at ID: ${newUserId}`);

  // 2. IMPORT SESSIONS
  const sessionRows = parseCSV(path.join(BASE_PATH, 'sessions.csv'));
  const sessionMap = new Map<string, number>();

  for (const row of sessionRows) {
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
  }
  console.log(`✅ ${sessionMap.size} sessions imported.`);

  // 3. IMPORT MESSAGES
  const messageRows = parseCSV(path.join(BASE_PATH, 'messages.csv'));
  let msgCount = 0;
  for (const row of messageRows) {
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
    }
  }
  console.log(`✅ ${msgCount} messages imported.`);

  // 4. IMPORT INSIGHTS
  const insightRows = parseCSV(path.join(BASE_PATH, 'insights.csv'));
  for (const row of insightRows) {
    if (row.user_id === '15') {
      await db.insert(insights).values({
        userId: newUserId,
        domain: row.domain,
        content: row.content,
        importance: parseInt(row.importance || '1'),
        createdAt: new Date(row.created_at),
      });
    }
  }
  console.log(`✅ Insights imported.`);

  // 5. IMPORT HABITS
  const habitRows = parseCSV(path.join(BASE_PATH, 'habits.csv'));
  for (const row of habitRows) {
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
  }
  console.log(`✅ Habits imported.`);

  console.log('\n💎 Shiro Soul Re-Import Complete!');
}

run().catch(console.error);
