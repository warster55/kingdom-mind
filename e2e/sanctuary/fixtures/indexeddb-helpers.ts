import { Page } from '@playwright/test';

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
  return await page.evaluate(async () => {
    return new Promise<IndexedDBSnapshot>((resolve) => {
      const snapshot: IndexedDBSnapshot = {
        sanctuary: null,
        biometric: null,
        rawBlob: null,
        blobParts: null,
        databaseExists: false,
        tables: []
      };

      const request = indexedDB.open('KingdomMindSanctuary', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('sanctuary')) {
          db.createObjectStore('sanctuary', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('biometric')) {
          db.createObjectStore('biometric', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        snapshot.databaseExists = true;
        snapshot.tables = Array.from(db.objectStoreNames);

        // Read sanctuary table
        try {
          const sanctuaryTx = db.transaction(['sanctuary'], 'readonly');
          const sanctuaryStore = sanctuaryTx.objectStore('sanctuary');
          const sanctuaryReq = sanctuaryStore.get('sanctuary');

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

            // Read biometric table
            try {
              const biometricTx = db.transaction(['biometric'], 'readonly');
              const biometricStore = biometricTx.objectStore('biometric');
              const biometricReq = biometricStore.get('biometric');

              biometricReq.onsuccess = () => {
                snapshot.biometric = biometricReq.result || null;
                db.close();
                resolve(snapshot);
              };

              biometricReq.onerror = () => {
                db.close();
                resolve(snapshot);
              };
            } catch {
              db.close();
              resolve(snapshot);
            }
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
  });
}

/**
 * Clear the entire IndexedDB database
 */
export async function clearIndexedDB(page: Page): Promise<void> {
  await page.evaluate(async () => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('KingdomMindSanctuary');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });
}

/**
 * Set a specific sanctuary blob in IndexedDB
 */
export async function setSanctuaryBlob(page: Page, blob: string): Promise<void> {
  await page.evaluate(async (blobValue) => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.open('KingdomMindSanctuary', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('sanctuary')) {
          db.createObjectStore('sanctuary', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('biometric')) {
          db.createObjectStore('biometric', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = db.transaction(['sanctuary'], 'readwrite');
        const store = tx.objectStore('sanctuary');

        store.put({
          id: 'sanctuary',
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
  }, blob);
}

/**
 * Set biometric enabled state in IndexedDB
 */
export async function setBiometricEnabled(
  page: Page,
  enabled: boolean,
  credentialId?: string
): Promise<void> {
  await page.evaluate(async ({ enabled, credentialId }) => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.open('KingdomMindSanctuary', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('sanctuary')) {
          db.createObjectStore('sanctuary', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('biometric')) {
          db.createObjectStore('biometric', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = db.transaction(['biometric'], 'readwrite');
        const store = tx.objectStore('biometric');

        store.put({
          id: 'biometric',
          enabled,
          credentialId
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
  }, { enabled, credentialId });
}

/**
 * Get just the raw blob from IndexedDB
 */
export async function getRawBlob(page: Page): Promise<string | null> {
  const snapshot = await getIndexedDBSnapshot(page);
  return snapshot.rawBlob;
}
