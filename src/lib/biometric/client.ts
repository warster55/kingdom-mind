'use client';

/**
 * Client-side biometric authentication using WebAuthn
 * Works across: iOS Touch ID, Android Fingerprint, Windows Hello, macOS Touch ID
 */

// Check if WebAuthn is available
export function isBiometricAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
}

// Check if platform authenticator (built-in biometric) is available
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isBiometricAvailable()) return false;

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('[Biometric] Platform authenticator check failed:', error);
    return false;
  }
}

// Generate a random challenge
function generateChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
}

// Convert ArrayBuffer to base64url string
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Convert base64url string to ArrayBuffer
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// RP (Relying Party) configuration
const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const RP_NAME = 'Kingdom Mind';

// User ID for this device (we use a fixed ID since this is device-local)
const USER_ID = 'sanctuary-user';
const USER_NAME = 'Sanctuary Guardian';

export interface BiometricCredential {
  credentialId: string;
  publicKey: string;
  createdAt: number;
}

/**
 * Register a new biometric credential (setup)
 * This prompts the user for fingerprint/Face ID/Windows Hello
 */
export async function registerBiometric(): Promise<BiometricCredential | null> {
  if (!isBiometricAvailable()) {
    throw new Error('Biometric authentication is not available on this device');
  }

  const challenge = generateChallenge();

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge as BufferSource,
    rp: {
      name: RP_NAME,
      id: RP_ID,
    },
    user: {
      id: new TextEncoder().encode(USER_ID),
      name: USER_NAME,
      displayName: USER_NAME,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Use built-in biometric (not security keys)
      userVerification: 'required',        // Must verify identity (fingerprint/face)
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none', // We don't need attestation for local-only use
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential | null;

    if (!credential) {
      return null;
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    return {
      credentialId: bufferToBase64url(credential.rawId),
      publicKey: bufferToBase64url(response.getPublicKey() || new ArrayBuffer(0)),
      createdAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof Error) {
      // User cancelled or other expected errors
      if (error.name === 'NotAllowedError') {
        console.log('[Biometric] User cancelled registration');
        return null;
      }
      if (error.name === 'InvalidStateError') {
        console.log('[Biometric] Credential already exists');
        throw new Error('A biometric credential already exists for this device');
      }
    }
    console.error('[Biometric] Registration failed:', error);
    throw error;
  }
}

/**
 * Authenticate with biometric (unlock)
 * This prompts the user to verify their identity
 */
export async function authenticateBiometric(credentialId: string): Promise<boolean> {
  if (!isBiometricAvailable()) {
    throw new Error('Biometric authentication is not available on this device');
  }

  const challenge = generateChallenge();

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge as BufferSource,
    rpId: RP_ID,
    allowCredentials: [
      {
        id: base64urlToBuffer(credentialId),
        type: 'public-key',
        transports: ['internal'], // Platform authenticator
      },
    ],
    userVerification: 'required',
    timeout: 60000,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential | null;

    if (!assertion) {
      return false;
    }

    // For local-only auth, we just need to verify the user completed the biometric
    // We don't need to cryptographically verify the signature since we're not doing server auth
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      console.log('[Biometric] User cancelled authentication');
      return false;
    }
    console.error('[Biometric] Authentication failed:', error);
    throw error;
  }
}

/**
 * Get friendly name for the biometric type available on this device
 */
export function getBiometricTypeName(): string {
  if (typeof window === 'undefined') return 'Biometric';

  const ua = navigator.userAgent.toLowerCase();

  // iOS
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'Face ID or Touch ID';
  }

  // macOS
  if (/macintosh|mac os x/.test(ua) && 'ontouchstart' in window === false) {
    return 'Touch ID';
  }

  // Windows
  if (/windows/.test(ua)) {
    return 'Windows Hello';
  }

  // Android
  if (/android/.test(ua)) {
    return 'Fingerprint';
  }

  return 'Biometric';
}
