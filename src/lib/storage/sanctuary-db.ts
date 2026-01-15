'use client';

import Dexie, { type Table } from 'dexie';

// The sanctuary blob is stored as a single encrypted string
interface SanctuaryStore {
  id: string; // Always 'sanctuary'
  blob: string; // Encrypted blob from server
  updatedAt: number; // Timestamp
}

// Biometric preference (stored separately, not encrypted)
interface BiometricStore {
  id: string; // Always 'biometric'
  enabled: boolean;
  credentialId?: string;
}

class SanctuaryDatabase extends Dexie {
  sanctuary!: Table<SanctuaryStore>;
  biometric!: Table<BiometricStore>;

  constructor() {
    super('KingdomMindSanctuary');
    this.version(1).stores({
      sanctuary: 'id',
      biometric: 'id',
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

// Biometric settings
export async function getBiometricEnabled(): Promise<boolean> {
  try {
    const record = await getDb().biometric.get('biometric');
    return record?.enabled || false;
  } catch (error) {
    console.error('[Sanctuary] Error getting biometric setting:', error);
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean, credentialId?: string): Promise<void> {
  try {
    await getDb().biometric.put({
      id: 'biometric',
      enabled,
      credentialId,
    });
  } catch (error) {
    console.error('[Sanctuary] Error setting biometric:', error);
    throw error;
  }
}

export async function getBiometricCredentialId(): Promise<string | undefined> {
  try {
    const record = await getDb().biometric.get('biometric');
    return record?.credentialId;
  } catch (error) {
    console.error('[Sanctuary] Error getting biometric credential:', error);
    return undefined;
  }
}
