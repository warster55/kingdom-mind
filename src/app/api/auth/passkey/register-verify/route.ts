import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, webauthnCredentials } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  verifyPasskeyRegistration,
  encodeCredentialId,
  encodePublicKey,
} from '@/lib/auth/webauthn';
import { challenges } from '../register-options/route';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

/**
 * POST /api/auth/passkey/register-verify
 * Verify and save a new passkey registration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);
    const body = await request.json();
    const response = body.response as RegistrationResponseJSON;

    if (!response) {
      return NextResponse.json(
        { error: 'Missing registration response' },
        { status: 400 }
      );
    }

    // Get stored challenge
    const expectedChallenge = challenges.get(userId);
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'No registration in progress. Please start again.' },
        { status: 400 }
      );
    }

    // Verify the registration
    const verification = await verifyPasskeyRegistration(response, expectedChallenge);

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Passkey verification failed' },
        { status: 400 }
      );
    }

    const {
      credentialID,
      credentialPublicKey,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo;

    // Store the credential
    await db.insert(webauthnCredentials).values({
      userId,
      credentialId: encodeCredentialId(credentialID),
      publicKey: encodePublicKey(credentialPublicKey),
      counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: response.response.transports || [],
      createdAt: new Date(),
    });

    // Clean up challenge
    challenges.delete(userId);

    return NextResponse.json({
      success: true,
      message: 'Passkey registered successfully. You can now use biometrics to unlock.',
    });
  } catch (error) {
    console.error('[Passkey Register Verify Error]:', error);
    return NextResponse.json(
      { error: 'Failed to verify passkey registration' },
      { status: 500 }
    );
  }
}
