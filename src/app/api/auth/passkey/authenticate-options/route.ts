import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, webauthnCredentials } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generatePasskeyAuthenticationOptions } from '@/lib/auth/webauthn';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';

// Store challenges temporarily
const authChallenges = new Map<number, string>();

export { authChallenges };

/**
 * POST /api/auth/passkey/authenticate-options
 * Generate WebAuthn authentication options for unlocking with passkey
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);

    // Get user's credentials
    const userCreds = await db
      .select({
        credentialId: webauthnCredentials.credentialId,
        publicKey: webauthnCredentials.publicKey,
        counter: webauthnCredentials.counter,
        transports: webauthnCredentials.transports,
      })
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.userId, userId));

    if (userCreds.length === 0) {
      return NextResponse.json(
        { error: 'No passkeys registered. Please set up a passkey first.' },
        { status: 400 }
      );
    }

    const formattedCreds = userCreds.map(c => ({
      credentialId: c.credentialId,
      publicKey: c.publicKey,
      counter: c.counter,
      transports: c.transports as AuthenticatorTransportFuture[] | undefined,
    }));

    // Generate authentication options
    const options = await generatePasskeyAuthenticationOptions(formattedCreds);

    // Store challenge
    authChallenges.set(userId, options.challenge);

    // Clean up after 5 minutes
    setTimeout(() => authChallenges.delete(userId), 5 * 60 * 1000);

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error('[Passkey Auth Options Error]:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}
