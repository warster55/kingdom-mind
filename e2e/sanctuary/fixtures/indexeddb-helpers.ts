import { Page } from '@playwright/test';

// Obfuscated names must match src/lib/storage/sanctuary-db.ts
// Export these so tests can check for proper table names
export const DB_NAME = '_kx7d2';
export const TABLE_STORE = '_s1';
export const TABLE_CHAT = '_c1';
export const RECORD_ID = '_r';

export interface SanctuaryRecord {
  id: string;
  blob: string;
  updatedAt: number;
}

export interface BiometricRecord {
  id: string;
  enabled: boolean;
  credentialId?: string;
}

export interface BlobParts {
  iv: string;
  authTag: string;
  encrypted: string;
}

export interface IndexedDBSnapshot {
  sanctuary: SanctuaryRecord | null;
  biometric: BiometricRecord | null;
  rawBlob: string | null;
  blobParts: BlobParts | null;
  databaseExists: boolean;
  tables: string[];
}

/**
 * Get a complete snapshot of the IndexedDB state
 */
export async function getIndexedDBSnapshot(page: Page): Promise<IndexedDBSnapshot> {
  return await page.evaluate(async ({ dbName, tableStore, recordId }) => {
    return new Promise<IndexedDBSnapshot>((resolve) => {
      const snapshot: IndexedDBSnapshot = {
        sanctuary: null,
        biometric: null,
        rawBlob: null,
        blobParts: null,
        databaseExists: false,
        tables: []
      };

      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(tableStore)) {
          db.createObjectStore(tableStore, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        snapshot.databaseExists = true;
        snapshot.tables = Array.from(db.objectStoreNames);

        // Read sanctuary table
        try {
          const sanctuaryTx = db.transaction([tableStore], 'readonly');
          const sanctuaryStore = sanctuaryTx.objectStore(tableStore);
          const sanctuaryReq = sanctuaryStore.get(recordId);

          sanctuaryReq.onsuccess = () => {
            if (sanctuaryReq.result) {
              snapshot.sanctuary = sanctuaryReq.result;
              snapshot.rawBlob = sanctuaryReq.result.blob;

              // Parse blob parts if present
              if (snapshot.rawBlob) {
                const parts = snapshot.rawBlob.split(':');
                if (parts.length === 3) {
                  snapshot.blobParts = {
                    iv: parts[0],
                    authTag: parts[1],
                    encrypted: parts[2]
                  };
                }
              }
            }
            db.close();
            resolve(snapshot);
          };

          sanctuaryReq.onerror = () => {
            db.close();
            resolve(snapshot);
          };
        } catch {
          db.close();
          resolve(snapshot);
        }
      };

      request.onerror = () => {
        resolve(snapshot);
      };
    });
  }, { dbName: DB_NAME, tableStore: TABLE_STORE, recordId: RECORD_ID });
}

/**
 * Clear the entire IndexedDB database (both new and legacy)
 */
export async function clearIndexedDB(page: Page): Promise<void> {
  await page.evaluate(async (dbName) => {
    // Delete both new obfuscated DB and legacy DB
    const deleteDb = (name: string) => new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
    await deleteDb(dbName);
    await deleteDb('KingdomMindSanctuary'); // Legacy DB
  }, DB_NAME);
}

/**
 * Set a specific sanctuary blob in IndexedDB
 */
export async function setSanctuaryBlob(page: Page, blob: string): Promise<void> {
  await page.evaluate(async ({ blobValue, dbName, tableStore, recordId }) => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(tableStore)) {
          db.createObjectStore(tableStore, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = db.transaction([tableStore], 'readwrite');
        const store = tx.objectStore(tableStore);

        store.put({
          id: recordId,
          blob: blobValue,
          updatedAt: Date.now()
        });

        tx.oncomplete = () => {
          db.close();
          resolve();
        };

        tx.onerror = () => {
          db.close();
          resolve();
        };
      };

      request.onerror = () => {
        resolve();
      };
    });
  }, { blobValue: blob, dbName: DB_NAME, tableStore: TABLE_STORE, recordId: RECORD_ID });
}

/**
 * Set biometric enabled state in IndexedDB
 * @deprecated Biometric feature not implemented - stub only for test compatibility
 */
export async function setBiometricEnabled(
  _page: Page,
  _enabled: boolean,
  _credentialId?: string
): Promise<void> {
  // Biometric feature not implemented in current schema
  // This is a stub to prevent import errors in tests
  return Promise.resolve();
}

/**
 * Get just the raw blob from IndexedDB
 */
export async function getRawBlob(page: Page): Promise<string | null> {
  const snapshot = await getIndexedDBSnapshot(page);
  return snapshot.rawBlob;
}
