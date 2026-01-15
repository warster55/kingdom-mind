import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  validateSeedPhrase,
  verifySeedPhrase,
  recoverUserKey,
} from '@/lib/auth/seed-phrase';
import crypto from 'node:crypto';

/**
 * Hash email for lookup (same as auth-options.ts)
 */
function hashEmail(email: string): string {
  const salt = process.env.IDENTITY_SALT || 'sanctuary-salt-v1';
  return crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');
}

/**
 * POST /api/auth/seed-phrase/verify
 * Verify a seed phrase for account recovery
 * This is used during login when user chooses seed phrase recovery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, seedPhrase } = body;

    if (!email || !seedPhrase) {
      return NextResponse.json(
        { error: 'Email and seed phrase are required' },
        { status: 400 }
      );
    }

    // Validate BIP39 format
    if (!validateSeedPhrase(seedPhrase)) {
      return NextResponse.json(
        { error: 'Invalid seed phrase format' },
        { status: 400 }
      );
    }

    // Find user by email hash
    const identityHash = hashEmail(email);
    const [user] = await db
      .select({
        id: users.id,
        seedPhraseHash: users.seedPhraseHash,
        encryptedUserKey: users.encryptedUserKey,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, identityHash))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.seedPhraseHash) {
      return NextResponse.json(
        { error: 'No seed phrase configured for this account' },
        { status: 400 }
      );
    }

    // Verify the seed phrase matches
    const isValid = verifySeedPhrase(seedPhrase, user.seedPhraseHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Seed phrase is valid - recover the user encryption key
    let userKey: string | null = null;
    if (user.encryptedUserKey) {
      try {
        userKey = recoverUserKey(seedPhrase, user.encryptedUserKey, user.id);
      } catch {
        console.error('[Seed Recovery] Failed to recover user key');
      }
    }

    // Return success - the actual session creation happens via NextAuth
    return NextResponse.json({
      success: true,
      userId: user.id,
      message: 'Seed phrase verified. You can now log in.',
      // Note: Don't return the userKey in the response - it's for internal use
    });
  } catch (error) {
    console.error('[Seed Phrase Verify Error]:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
