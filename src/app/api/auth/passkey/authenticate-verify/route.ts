import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users, webauthnCredentials } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyPasskeyAuthentication } from '@/lib/auth/webauthn';
import { authChallenges } from '../authenticate-options/route';
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from '@simplewebauthn/types';

/**
 * POST /api/auth/passkey/authenticate-verify
 * Verify passkey authentication for session unlock
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);
    const body = await request.json();
    const response = body.response as AuthenticationResponseJSON;

    if (!response) {
      return NextResponse.json(
        { error: 'Missing authentication response' },
        { status: 400 }
      );
    }

    // Get stored challenge
    const expectedChallenge = authChallenges.get(userId);
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'No authentication in progress. Please start again.' },
        { status: 400 }
      );
    }

    // Find the credential used
    const credentialIdBase64 = response.id;
    const [credential] = await db
      .select({
        id: webauthnCredentials.id,
        credentialId: webauthnCredentials.credentialId,
        publicKey: webauthnCredentials.publicKey,
        counter: webauthnCredentials.counter,
        transports: webauthnCredentials.transports,
      })
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.credentialId, credentialIdBase64))
      .limit(1);

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 400 }
      );
    }

    // Verify the authentication
    const verification = await verifyPasskeyAuthentication(
      response,
      expectedChallenge,
      {
        credentialId: credential.credentialId,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransportFuture[] | undefined,
      }
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Passkey verification failed' },
        { status: 400 }
      );
    }

    // Update counter to prevent replay attacks
    await db
      .update(webauthnCredentials)
      .set({
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      })
      .where(eq(webauthnCredentials.id, credential.id));

    // Update user's last activity
    await db
      .update(users)
      .set({ lastActivityAt: new Date() })
      .where(eq(users.id, userId));

    // Clean up challenge
    authChallenges.delete(userId);

    return NextResponse.json({
      success: true,
      message: 'Session unlocked successfully',
    });
  } catch (error) {
    console.error('[Passkey Auth Verify Error]:', error);
    return NextResponse.json(
      { error: 'Failed to verify passkey' },
      { status: 500 }
    );
  }
}
