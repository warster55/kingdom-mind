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

// Chat history message (decrypted form, used in UI)
export interface ChatHistoryMessage {
  id: string; // UUID
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  hasBreakthrough?: boolean;
}

// Encrypted chat record stored in IndexedDB
interface EncryptedChatRecord {
  id: string;
  encryptedBlob: string; // Server-encrypted message
  timestamp: number; // For ordering (not encrypted)
}

class SanctuaryDatabase extends Dexie {
  [TABLE_STORE]!: Table<SanctuaryStore>;
  [TABLE_CHAT]!: Table<EncryptedChatRecord>;

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

    // Note: Legacy chat history is NOT migrated because:
    // 1. Legacy messages are plaintext (security concern)
    // 2. New system uses server-side encryption
    // 3. Client cannot encrypt without server roundtrip
    // Users will start fresh with encrypted chat storage
    console.log('[DB] Legacy chat history not migrated (plaintext -> encrypted)');

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
// Chat History Functions (Encrypted Storage)
// ============================================
// Messages are encrypted by server before storage
// Client stores encrypted blobs, cannot read contents

// Generate a UUID for chat messages
function generateUUID(): string {
  return crypto.randomUUID();
}

// Save an encrypted chat message blob
export async function saveEncryptedMessage(
  encryptedBlob: string,
  timestamp: number
): Promise<string> {
  try {
    await migrateFromLegacy();
    const id = generateUUID();
    await getDb()[TABLE_CHAT].put({
      id,
      encryptedBlob,
      timestamp,
    });
    return id;
  } catch (error) {
    console.error('[DB] Error saving encrypted message:', error);
    throw error;
  }
}

// Load encrypted chat blobs (for server decryption)
export async function loadEncryptedMessages(): Promise<Array<{ id: string; encryptedBlob: string; timestamp: number }>> {
  try {
    await migrateFromLegacy();
    const records = await getDb()
      [TABLE_CHAT].orderBy('timestamp')
      .reverse()
      .limit(50)
      .toArray();
    // Return in chronological order (oldest first)
    return records.reverse();
  } catch (error) {
    console.error('[DB] Error loading encrypted messages:', error);
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

// Legacy wrapper for backward compatibility (deprecated)
// Use saveEncryptedMessage and loadEncryptedMessages instead
export async function saveChatMessage(
  message: Omit<ChatHistoryMessage, 'id'>
): Promise<string> {
  console.warn('[DB] saveChatMessage is deprecated - messages should be encrypted');
  // Store as unencrypted for backward compatibility during migration
  const id = generateUUID();
  await getDb()[TABLE_CHAT].put({
    id,
    encryptedBlob: JSON.stringify(message), // Not actually encrypted - legacy
    timestamp: message.timestamp,
  });
  return id;
}

export async function loadChatHistory(): Promise<ChatHistoryMessage[]> {
  console.warn('[DB] loadChatHistory is deprecated - use loadEncryptedMessages');
  // Try to parse as legacy format
  const records = await loadEncryptedMessages();
  return records.map(r => {
    try {
      // Try to parse as JSON (legacy unencrypted)
      const parsed = JSON.parse(r.encryptedBlob);
      return { id: r.id, ...parsed };
    } catch {
      // If it fails, it's encrypted - return placeholder
      return {
        id: r.id,
        role: 'assistant' as const,
        content: '[Encrypted message - requires server decryption]',
        timestamp: r.timestamp,
      };
    }
  });
}
