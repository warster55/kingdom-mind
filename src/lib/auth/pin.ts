import crypto from 'node:crypto';

/**
 * Hash a PIN for secure storage
 * Uses PBKDF2 with a user-specific salt
 */
export function hashPin(pin: string, salt: string): string {
  // PBKDF2 with 100,000 iterations for PIN hashing
  const derivedKey = crypto.pbkdf2Sync(
    pin,
    salt,
    100000,
    64,
    'sha256'
  );
  return derivedKey.toString('hex');
}

/**
 * Generate a salt for PIN hashing
 */
export function generatePinSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify a PIN against a stored hash
 */
export function verifyPin(pin: string, salt: string, storedHash: string): boolean {
  const computedHash = hashPin(pin, salt);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}

/**
 * Validate PIN format (6 digits)
 */
export function validatePinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Create a combined hash with embedded salt for storage
 * Format: salt:hash
 */
export function createPinHash(pin: string): string {
  const salt = generatePinSalt();
  const hash = hashPin(pin, salt);
  return `${salt}:${hash}`;
}

/**
 * Verify a PIN against a combined salt:hash string
 */
export function verifyPinHash(pin: string, storedValue: string): boolean {
  const [salt, hash] = storedValue.split(':');
  if (!salt || !hash) return false;
  return verifyPin(pin, salt, hash);
}
