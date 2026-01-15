import * as bip39 from 'bip39';
import crypto from 'node:crypto';
import { encrypt, decrypt } from '@/lib/utils/encryption';

// BIP39 supports 12, 15, 18, 21, or 24 words
// Using 24 words for maximum entropy (256 bits)
const MNEMONIC_STRENGTH = 256; // 24 words

/**
 * Generate a new BIP39 seed phrase (24 words)
 */
export function generateSeedPhrase(): string {
  return bip39.generateMnemonic(MNEMONIC_STRENGTH);
}

/**
 * Validate a BIP39 seed phrase
 */
export function validateSeedPhrase(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Convert a seed phrase to a seed buffer (512-bit)
 * @param mnemonic - The BIP39 seed phrase
 * @param passphrase - Optional passphrase for additional security
 */
export function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Buffer {
  return bip39.mnemonicToSeedSync(mnemonic, passphrase);
}

/**
 * Derive an encryption key from a seed phrase using HKDF
 * @param mnemonic - The BIP39 seed phrase
 * @param salt - Unique salt (e.g., user ID or app-specific value)
 * @param info - Context info for key derivation (e.g., 'encryption-key')
 * @returns 32-byte encryption key suitable for AES-256
 */
export function deriveEncryptionKey(
  mnemonic: string,
  salt: string,
  info: string = 'km-encryption-key'
): Buffer {
  const seed = mnemonicToSeed(mnemonic);

  // HKDF-SHA256 to derive a 32-byte key
  const derivedKey = crypto.hkdfSync(
    'sha256',
    seed,
    Buffer.from(salt, 'utf8'),
    Buffer.from(info, 'utf8'),
    32 // 256 bits for AES-256
  );

  return Buffer.from(derivedKey);
}

/**
 * Create a one-way hash of the seed phrase for verification
 * This allows checking if a user's seed phrase is correct without storing it
 */
export function hashSeedPhrase(mnemonic: string, salt: string): string {
  return crypto
    .createHmac('sha256', salt)
    .update(mnemonic.toLowerCase().trim())
    .digest('hex');
}

/**
 * Encrypt data with a seed-phrase-derived key
 * @param data - Data to encrypt
 * @param mnemonic - The seed phrase to derive the key from
 * @param userId - User ID for salt
 */
export function encryptWithSeedKey(
  data: string,
  mnemonic: string,
  userId: number
): string {
  const key = deriveEncryptionKey(mnemonic, `user-${userId}`);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encryptedContent (same as existing encryption.ts)
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt data with a seed-phrase-derived key
 * @param encryptedData - Encrypted data string
 * @param mnemonic - The seed phrase to derive the key from
 * @param userId - User ID for salt
 */
export function decryptWithSeedKey(
  encryptedData: string,
  mnemonic: string,
  userId: number
): string {
  if (!encryptedData || !encryptedData.includes(':')) {
    return encryptedData;
  }

  try {
    const key = deriveEncryptionKey(mnemonic, `user-${userId}`);
    const [ivHex, authTagHex, encryptedContentHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedContentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Seed Key Decryption] Failed:', error);
    throw new Error('Decryption failed - invalid seed phrase or corrupted data');
  }
}

/**
 * Generate a random per-user encryption key
 * This key is stored encrypted with the seed-phrase-derived key
 */
export function generateUserEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Full seed phrase setup flow
 * @param userId - User ID for key derivation salt
 * @returns Object with seed phrase, hash, and encrypted user key
 */
export function initializeSeedPhraseSetup(userId: number): {
  seedPhrase: string;
  seedPhraseHash: string;
  userEncryptionKey: string;
  encryptedUserKey: string;
} {
  const seedPhrase = generateSeedPhrase();
  const salt = process.env.IDENTITY_SALT || 'km-seed-salt';
  const seedPhraseHash = hashSeedPhrase(seedPhrase, salt);

  // Generate a random per-user encryption key
  const userEncryptionKey = generateUserEncryptionKey();

  // Encrypt the user key with the seed-phrase-derived key
  const encryptedUserKey = encryptWithSeedKey(userEncryptionKey, seedPhrase, userId);

  return {
    seedPhrase,
    seedPhraseHash,
    userEncryptionKey,
    encryptedUserKey,
  };
}

/**
 * Verify a seed phrase matches the stored hash
 */
export function verifySeedPhrase(mnemonic: string, storedHash: string): boolean {
  const salt = process.env.IDENTITY_SALT || 'km-seed-salt';
  const computedHash = hashSeedPhrase(mnemonic, salt);
  return computedHash === storedHash;
}

/**
 * Recover user encryption key from seed phrase
 * @param mnemonic - The seed phrase
 * @param encryptedUserKey - The stored encrypted user key
 * @param userId - User ID for key derivation
 */
export function recoverUserKey(
  mnemonic: string,
  encryptedUserKey: string,
  userId: number
): string {
  return decryptWithSeedKey(encryptedUserKey, mnemonic, userId);
}
