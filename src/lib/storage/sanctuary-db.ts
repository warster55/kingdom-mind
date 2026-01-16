'use client';

import Dexie, { type Table } from 'dexie';

// Obfuscated names for security (not readable in DevTools)
const DB_NAME = '_kx7d2';
const LEGACY_DB_NAME = 'KingdomMindSanctuary';
const TABLE_STORE = '_s1';  // sanctuary store
const TABLE_CHAT = '_c1';   // chat history
const RECORD_ID = '_r';     // record identifier

// The sanctuary blob is stored as a single encrypted string
interface SanctuaryStore {
  id: string;
  blob: string; // Encrypted blob from server
  updatedAt: number; // Timestamp
}

// Chat history message stored locally
export interface ChatHistoryMessage {
  id: string; // UUID
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  hasBreakthrough?: boolean;
}

class SanctuaryDatabase extends Dexie {
  [TABLE_STORE]!: Table<SanctuaryStore>;
  [TABLE_CHAT]!: Table<ChatHistoryMessage>;

  constructor() {
    super(DB_NAME);

    // Version 1: both stores
    this.version(1).stores({
      [TABLE_STORE]: 'id',
      [TABLE_CHAT]: 'id, timestamp',
    });
  }
}

// Legacy database for migration
class LegacyDatabase extends Dexie {
  sanctuary!: Table<SanctuaryStore>;
  chatHistory!: Table<ChatHistoryMessage>;

  constructor() {
    super(LEGACY_DB_NAME);
    this.version(3).stores({
      sanctuary: 'id',
      chatHistory: 'id, timestamp',
    });
  }
}

// Singleton instance
let db: SanctuaryDatabase | null = null;
let migrationComplete = false;

function getDb(): SanctuaryDatabase {
  if (!db) {
    db = new SanctuaryDatabase();
  }
  return db;
}

// Migrate data from legacy database to new obfuscated database
async function migrateFromLegacy(): Promise<void> {
  if (migrationComplete) return;
  migrationComplete = true;

  try {
    // Check if legacy database exists
    const databases = await Dexie.getDatabaseNames();
    if (!databases.includes(LEGACY_DB_NAME)) {
      return; // No legacy data to migrate
    }

    const legacy = new LegacyDatabase();
    const newDb = getDb();

    // Check if new database already has data
    const existingData = await newDb[TABLE_STORE].get(RECORD_ID);
    if (existingData) {
      // Already migrated, delete legacy
      await legacy.delete();
      return;
    }

    // Migrate sanctuary blob
    const legacyBlob = await legacy.sanctuary.get('sanctuary');
    if (legacyBlob) {
      await newDb[TABLE_STORE].put({
        id: RECORD_ID,
        blob: legacyBlob.blob,
        updatedAt: legacyBlob.updatedAt,
      });
    }

    // Migrate chat history
    const legacyMessages = await legacy.chatHistory.toArray();
    if (legacyMessages.length > 0) {
      await newDb[TABLE_CHAT].bulkPut(legacyMessages);
    }

    // Delete legacy database
    await legacy.delete();
    console.log('[DB] Migration complete');
  } catch (error) {
    console.error('[DB] Migration error:', error);
    // Don't throw - continue with new database
  }
}

// Get the encrypted blob
export async function getEncryptedBlob(): Promise<string | null> {
  try {
    await migrateFromLegacy();
    const record = await getDb()[TABLE_STORE].get(RECORD_ID);
    return record?.blob || null;
  } catch (error) {
    console.error('[DB] Error getting blob:', error);
    return null;
  }
}

// Store the encrypted blob
export async function setEncryptedBlob(blob: string): Promise<void> {
  try {
    await migrateFromLegacy();
    await getDb()[TABLE_STORE].put({
      id: RECORD_ID,
      blob,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('[DB] Error setting blob:', error);
    throw error;
  }
}

// Check if a sanctuary exists
export async function hasSanctuary(): Promise<boolean> {
  try {
    await migrateFromLegacy();
    const record = await getDb()[TABLE_STORE].get(RECORD_ID);
    return !!record?.blob;
  } catch (error) {
    console.error('[DB] Error checking data:', error);
    return false;
  }
}

// Delete the sanctuary (start fresh)
export async function clearSanctuary(): Promise<void> {
  try {
    await migrateFromLegacy();
    await getDb()[TABLE_STORE].delete(RECORD_ID);
  } catch (error) {
    console.error('[DB] Error clearing data:', error);
    throw error;
  }
}

// ============================================
// Chat History Functions
// ============================================

// Generate a UUID for chat messages
function generateUUID(): string {
  return crypto.randomUUID();
}

// Save a single chat message
export async function saveChatMessage(
  message: Omit<ChatHistoryMessage, 'id'>
): Promise<string> {
  try {
    await migrateFromLegacy();
    const id = generateUUID();
    await getDb()[TABLE_CHAT].put({
      id,
      ...message,
    });
    return id;
  } catch (error) {
    console.error('[DB] Error saving message:', error);
    throw error;
  }
}

// Load chat history (limit 50, sorted by timestamp ascending)
export async function loadChatHistory(): Promise<ChatHistoryMessage[]> {
  try {
    await migrateFromLegacy();
    const messages = await getDb()
      [TABLE_CHAT].orderBy('timestamp')
      .reverse()
      .limit(50)
      .toArray();
    // Return in chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('[DB] Error loading history:', error);
    return [];
  }
}

// Clear all chat history (for reset journey)
export async function clearChatHistory(): Promise<void> {
  try {
    await migrateFromLegacy();
    await getDb()[TABLE_CHAT].clear();
  } catch (error) {
    console.error('[DB] Error clearing history:', error);
    throw error;
  }
}

// Delete messages older than 7 days
export async function cleanupOldMessages(): Promise<number> {
  try {
    await migrateFromLegacy();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const deletedCount = await getDb()
      [TABLE_CHAT].where('timestamp')
      .below(sevenDaysAgo)
      .delete();
    if (deletedCount > 0) {
      console.log(`[DB] Cleaned up ${deletedCount} old messages`);
    }
    return deletedCount;
  } catch (error) {
    console.error('[DB] Error cleaning up old messages:', error);
    return 0;
  }
}
