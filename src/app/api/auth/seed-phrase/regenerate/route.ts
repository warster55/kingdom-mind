import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { initializeSeedPhraseSetup } from '@/lib/auth/seed-phrase';
import { verifyTotp, decryptTotpSecret } from '@/lib/auth/totp';

/**
 * POST /api/auth/seed-phrase/regenerate
 * Generate a new seed phrase for an authenticated user who lost their old one
 * WARNING: This will invalidate the old seed phrase and re-encrypt the user key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);
    const body = await request.json();
    const { verificationCode, confirmRegenerate } = body;

    if (!confirmRegenerate) {
      return NextResponse.json(
        {
          error: 'You must confirm regeneration by setting confirmRegenerate: true',
          warning:
            'Regenerating will invalidate your old seed phrase permanently. Make sure you want to proceed.',
        },
        { status: 400 }
      );
    }

    // Get user data for verification
    const [user] = await db
      .select({
        totpSecret: users.totpSecret,
        totpEnabledAt: users.totpEnabledAt,
        seedPhraseCreatedAt: users.seedPhraseCreatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Require TOTP verification if enabled
    if (user?.totpEnabledAt && user?.totpSecret) {
      if (!verificationCode) {
        return NextResponse.json(
          { error: 'TOTP verification code required' },
          { status: 400 }
        );
      }

      const secret = decryptTotpSecret(user.totpSecret);
      const isValid = verifyTotp(verificationCode, secret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }
    }

    // Generate new seed phrase and encryption key
    const { seedPhrase, seedPhraseHash, encryptedUserKey } =
      initializeSeedPhraseSetup(userId);

    // Update user with new seed phrase hash and encrypted key
    await db
      .update(users)
      .set({
        seedPhraseHash,
        encryptedUserKey,
        seedPhraseCreatedAt: new Date(),
        authMethod: 'seed_phrase',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Return the new seed phrase ONCE
    return NextResponse.json({
      success: true,
      seedPhrase,
      wordCount: seedPhrase.split(' ').length,
      warning:
        'CRITICAL: Write down these words in order. This is the ONLY time they will be shown. Your old seed phrase is now INVALID.',
      previousSeedPhraseCreatedAt: user?.seedPhraseCreatedAt,
    });
  } catch (error) {
    console.error('[Seed Phrase Regenerate Error]:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate seed phrase' },
      { status: 500 }
    );
  }
}
