import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { encrypt, decrypt } from '@/lib/utils/encryption';

const APP_NAME = 'KingdomMind';

/**
 * Generate a new TOTP secret for a user
 */
export function generateTotpSecret(): string {
  return generateSecret();
}

/**
 * Generate the otpauth URI for authenticator apps
 * @param secret - The raw TOTP secret
 * @param accountName - User identifier (can be anonymous like "User123")
 */
export function generateTotpUri(secret: string, accountName: string): string {
  return generateURI({
    issuer: APP_NAME,
    label: accountName,
    secret,
    strategy: 'totp',
  });
}

/**
 * Generate a QR code data URL for the TOTP URI
 * @param uri - The otpauth URI
 * @returns Base64 data URL of the QR code
 */
export async function generateQrCodeDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Verify a TOTP code against a secret
 * @param token - The 6-digit code from the user
 * @param secret - The raw TOTP secret
 * @returns true if valid
 */
export function verifyTotp(token: string, secret: string): boolean {
  try {
    const result = verifySync({
      token,
      secret,
      strategy: 'totp',
      epochTolerance: 1, // Allow 1 time step tolerance (30 seconds)
    });
    return result.valid;
  } catch {
    return false;
  }
}

/**
 * Encrypt a TOTP secret for storage
 */
export function encryptTotpSecret(secret: string): string {
  return encrypt(secret);
}

/**
 * Decrypt a stored TOTP secret
 */
export function decryptTotpSecret(encryptedSecret: string): string {
  return decrypt(encryptedSecret);
}

/**
 * Full TOTP setup flow - generates secret, URI, and QR code
 * @param userId - User ID for account naming
 * @returns Object with secret, uri, qrCode, and encryptedSecret
 */
export async function initializeTotpSetup(userId: number): Promise<{
  secret: string;
  uri: string;
  qrCode: string;
  encryptedSecret: string;
}> {
  const secret = generateTotpSecret();
  const accountName = `User${userId}`;
  const uri = generateTotpUri(secret, accountName);
  const qrCode = await generateQrCodeDataUrl(uri);
  const encryptedSecret = encryptTotpSecret(secret);

  return {
    secret,
    uri,
    qrCode,
    encryptedSecret,
  };
}
