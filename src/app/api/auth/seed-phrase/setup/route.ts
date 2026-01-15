import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { initializeSeedPhraseSetup } from '@/lib/auth/seed-phrase';

/**
 * POST /api/auth/seed-phrase/setup
 * Generate a new seed phrase for the authenticated user
 * IMPORTANT: The seed phrase is shown only ONCE - user must write it down
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);

    // Check if user already has a seed phrase
    const [user] = await db
      .select({ seedPhraseCreatedAt: users.seedPhraseCreatedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.seedPhraseCreatedAt) {
      return NextResponse.json(
        {
          error: 'Seed phrase already exists. Use /reveal to view it, or /regenerate to create a new one.',
        },
        { status: 400 }
      );
    }

    // Generate seed phrase and encryption key
    const { seedPhrase, seedPhraseHash, encryptedUserKey } =
      initializeSeedPhraseSetup(userId);

    // Store the hash and encrypted key (NOT the seed phrase itself)
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

    // Return the seed phrase ONCE for user to write down
    // This is the only time the seed phrase is shown
    return NextResponse.json({
      success: true,
      seedPhrase,
      wordCount: seedPhrase.split(' ').length,
      warning:
        'CRITICAL: Write down these words in order. This is the ONLY time they will be shown. If you lose them, you will lose access to your account.',
    });
  } catch (error) {
    console.error('[Seed Phrase Setup Error]:', error);
    return NextResponse.json(
      { error: 'Failed to generate seed phrase' },
      { status: 500 }
    );
  }
}
