'use client';

import Dexie, { type Table } from 'dexie';

// The sanctuary blob is stored as a single encrypted string
interface SanctuaryStore {
  id: string; // Always 'sanctuary'
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
  sanctuary!: Table<SanctuaryStore>;
  chatHistory!: Table<ChatHistoryMessage>;

  constructor() {
    super('KingdomMindSanctuary');

    // Version 2: sanctuary only
    this.version(2).stores({
      sanctuary: 'id',
    });

    // Version 3: add chatHistory table
    this.version(3).stores({
      sanctuary: 'id',
      chatHistory: 'id, timestamp',
    });
  }
}

// Singleton instance
let db: SanctuaryDatabase | null = null;

function getDb(): SanctuaryDatabase {
  if (!db) {
    db = new SanctuaryDatabase();
  }
  return db;
}

// Get the encrypted blob
export async function getEncryptedBlob(): Promise<string | null> {
  try {
    const record = await getDb().sanctuary.get('sanctuary');
    return record?.blob || null;
  } catch (error) {
    console.error('[Sanctuary] Error getting blob:', error);
    return null;
  }
}

// Store the encrypted blob
export async function setEncryptedBlob(blob: string): Promise<void> {
  try {
    await getDb().sanctuary.put({
      id: 'sanctuary',
      blob,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('[Sanctuary] Error setting blob:', error);
    throw error;
  }
}

// Check if a sanctuary exists
export async function hasSanctuary(): Promise<boolean> {
  try {
    const record = await getDb().sanctuary.get('sanctuary');
    return !!record?.blob;
  } catch (error) {
    console.error('[Sanctuary] Error checking sanctuary:', error);
    return false;
  }
}

// Delete the sanctuary (start fresh)
export async function clearSanctuary(): Promise<void> {
  try {
    await getDb().sanctuary.delete('sanctuary');
  } catch (error) {
    console.error('[Sanctuary] Error clearing sanctuary:', error);
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
    const id = generateUUID();
    await getDb().chatHistory.put({
      id,
      ...message,
    });
    return id;
  } catch (error) {
    console.error('[ChatHistory] Error saving message:', error);
    throw error;
  }
}

// Load chat history (limit 50, sorted by timestamp ascending)
export async function loadChatHistory(): Promise<ChatHistoryMessage[]> {
  try {
    const messages = await getDb()
      .chatHistory.orderBy('timestamp')
      .reverse()
      .limit(50)
      .toArray();
    // Return in chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('[ChatHistory] Error loading history:', error);
    return [];
  }
}

// Clear all chat history (for reset journey)
export async function clearChatHistory(): Promise<void> {
  try {
    await getDb().chatHistory.clear();
  } catch (error) {
    console.error('[ChatHistory] Error clearing history:', error);
    throw error;
  }
}

// Delete messages older than 7 days
export async function cleanupOldMessages(): Promise<number> {
  try {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const deletedCount = await getDb()
      .chatHistory.where('timestamp')
      .below(sevenDaysAgo)
      .delete();
    if (deletedCount > 0) {
      console.log(`[ChatHistory] Cleaned up ${deletedCount} old messages`);
    }
    return deletedCount;
  } catch (error) {
    console.error('[ChatHistory] Error cleaning up old messages:', error);
    return 0;
  }
}
