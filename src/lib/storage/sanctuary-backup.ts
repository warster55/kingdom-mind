'use client';

import QRCode from 'qrcode';
import { getEncryptedBlob, setEncryptedBlob } from './sanctuary-db';

// QR code max practical size is ~2.9KB for alphanumeric data
const QR_MAX_SIZE = 2900;

export interface BackupData {
  version: 1;
  blob: string;
  exportedAt: number;
}

/**
 * Export sanctuary data for backup
 * Returns QR code data URL if small enough, otherwise returns file data
 */
export async function exportSanctuary(): Promise<{
  type: 'qr' | 'file';
  data: string; // QR: data URL, File: JSON string
  size: number;
} | null> {
  const blob = await getEncryptedBlob();

  if (!blob) {
    return null;
  }

  const backupData: BackupData = {
    version: 1,
    blob,
    exportedAt: Date.now(),
  };

  const jsonString = JSON.stringify(backupData);
  const size = jsonString.length;

  if (size <= QR_MAX_SIZE) {
    // Small enough for QR code
    const qrDataUrl = await QRCode.toDataURL(jsonString, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1c1917', // stone-900
        light: '#fafaf9', // stone-50
      },
    });

    return {
      type: 'qr',
      data: qrDataUrl,
      size,
    };
  } else {
    // Too large for QR, return as file
    return {
      type: 'file',
      data: jsonString,
      size,
    };
  }
}

/**
 * Generate a downloadable file for sanctuary backup
 */
export async function downloadBackupFile(): Promise<void> {
  const blob = await getEncryptedBlob();

  if (!blob) {
    throw new Error('No sanctuary data to export');
  }

  const backupData: BackupData = {
    version: 1,
    blob,
    exportedAt: Date.now(),
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const file = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(file);

  const a = document.createElement('a');
  a.href = url;
  a.download = `kingdom-mind-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import sanctuary data from backup
 * @param data - JSON string from QR scan or file upload
 * @returns true if import successful
 */
export async function importSanctuary(data: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const backupData = JSON.parse(data) as BackupData;

    // Validate structure
    if (backupData.version !== 1) {
      return { success: false, error: 'Unsupported backup version' };
    }

    if (!backupData.blob || typeof backupData.blob !== 'string') {
      return { success: false, error: 'Invalid backup data' };
    }

    // Validate blob format (should be IV:AuthTag:Encrypted)
    const parts = backupData.blob.split(':');
    if (parts.length !== 3) {
      return { success: false, error: 'Invalid encryption format' };
    }

    // Store the blob
    await setEncryptedBlob(backupData.blob);

    return { success: true };
  } catch (error) {
    console.error('[Sanctuary] Import error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import backup'
    };
  }
}

/**
 * Import from file input
 */
export async function importFromFile(file: File): Promise<{
  success: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) {
        resolve({ success: false, error: 'Could not read file' });
        return;
      }

      const result = await importSanctuary(content);
      resolve(result);
    };

    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}

/**
 * Get sanctuary data size for display
 */
export async function getSanctuarySize(): Promise<{
  exists: boolean;
  sizeBytes: number;
  sizeFormatted: string;
}> {
  const blob = await getEncryptedBlob();

  if (!blob) {
    return { exists: false, sizeBytes: 0, sizeFormatted: '0 B' };
  }

  const sizeBytes = blob.length;
  let sizeFormatted: string;

  if (sizeBytes < 1024) {
    sizeFormatted = `${sizeBytes} B`;
  } else if (sizeBytes < 1024 * 1024) {
    sizeFormatted = `${(sizeBytes / 1024).toFixed(1)} KB`;
  } else {
    sizeFormatted = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return { exists: true, sizeBytes, sizeFormatted };
}
