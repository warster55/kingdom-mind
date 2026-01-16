'use client';

import Dexie, { type Table } from 'dexie';

// The sanctuary blob is stored as a single encrypted string
interface SanctuaryStore {
  id: string; // Always 'sanctuary'
  blob: string; // Encrypted blob from server
  updatedAt: number; // Timestamp
}

class SanctuaryDatabase extends Dexie {
  sanctuary!: Table<SanctuaryStore>;

  constructor() {
    super('KingdomMindSanctuary');
    this.version(2).stores({
      sanctuary: 'id',
      // Note: biometric table removed in v2
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
