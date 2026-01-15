import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users, webauthnCredentials } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generatePasskeyRegistrationOptions } from '@/lib/auth/webauthn';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';

// Store challenges temporarily (in production, use Redis or database)
const challenges = new Map<number, string>();

export { challenges }; // Export for use in verify endpoint

/**
 * POST /api/auth/passkey/register-options
 * Generate WebAuthn registration options for setting up a passkey
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);

    // Get user info
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Get existing credentials
    const existingCreds = await db
      .select({
        credentialId: webauthnCredentials.credentialId,
        publicKey: webauthnCredentials.publicKey,
        counter: webauthnCredentials.counter,
        transports: webauthnCredentials.transports,
      })
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.userId, userId));

    const formattedCreds = existingCreds.map(c => ({
      credentialId: c.credentialId,
      publicKey: c.publicKey,
      counter: c.counter,
      transports: c.transports as AuthenticatorTransportFuture[] | undefined,
    }));

    // Generate registration options
    const options = await generatePasskeyRegistrationOptions(
      userId,
      user?.name || `User${userId}`,
      formattedCreds
    );

    // Store challenge for verification
    challenges.set(userId, options.challenge);

    // Clean up old challenges after 5 minutes
    setTimeout(() => challenges.delete(userId), 5 * 60 * 1000);

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error('[Passkey Register Options Error]:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}
