import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';

// Configuration
const RP_NAME = 'Kingdom Mind';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

export interface StoredCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}

/**
 * Generate options for registering a new passkey
 */
export async function generatePasskeyRegistrationOptions(
  userId: number,
  userName: string,
  existingCredentials: StoredCredential[] = []
): Promise<ReturnType<typeof generateRegistrationOptions>> {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: userId.toString(),
    userName: userName,
    userDisplayName: userName,
    timeout: 60000,
    attestationType: 'none', // We don't need attestation for our use case
    excludeCredentials: existingCredentials.map(cred => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key' as const,
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform', // Platform authenticators (fingerprint, face)
    },
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
  };

  return generateRegistrationOptions(opts);
}

/**
 * Verify a passkey registration response
 */
export async function verifyPasskeyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<VerifiedRegistrationResponse> {
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: true,
  };

  return verifyRegistrationResponse(opts);
}

/**
 * Generate options for authenticating with a passkey
 */
export async function generatePasskeyAuthenticationOptions(
  userCredentials: StoredCredential[] = []
): Promise<ReturnType<typeof generateAuthenticationOptions>> {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: RP_ID,
    timeout: 60000,
    userVerification: 'preferred',
    allowCredentials: userCredentials.map(cred => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key' as const,
      transports: cred.transports,
    })),
  };

  return generateAuthenticationOptions(opts);
}

/**
 * Verify a passkey authentication response
 */
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credential: StoredCredential
): Promise<VerifiedAuthenticationResponse> {
  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: Buffer.from(credential.credentialId, 'base64url'),
      credentialPublicKey: Buffer.from(credential.publicKey, 'base64url'),
      counter: credential.counter,
      transports: credential.transports,
    },
    requireUserVerification: true,
  };

  return verifyAuthenticationResponse(opts);
}

/**
 * Encode credential ID to base64url for storage
 */
export function encodeCredentialId(id: Uint8Array): string {
  return Buffer.from(id).toString('base64url');
}

/**
 * Encode public key to base64url for storage
 */
export function encodePublicKey(key: Uint8Array): string {
  return Buffer.from(key).toString('base64url');
}
