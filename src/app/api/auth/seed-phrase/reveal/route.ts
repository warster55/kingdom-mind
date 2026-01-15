import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyTotp, decryptTotpSecret } from '@/lib/auth/totp';

/**
 * POST /api/auth/seed-phrase/reveal
 * Reveal the seed phrase for the authenticated user
 * Requires additional verification (TOTP code or email OTP) for security
 *
 * NOTE: This endpoint does NOT actually store the seed phrase.
 * Users must write it down when first generated.
 * This endpoint returns an error directing them to regenerate if needed.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);
    const body = await request.json();
    const { verificationCode } = body;

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Verification code required for security' },
        { status: 400 }
      );
    }

    // Get user data
    const [user] = await db
      .select({
        seedPhraseCreatedAt: users.seedPhraseCreatedAt,
        totpSecret: users.totpSecret,
        totpEnabledAt: users.totpEnabledAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.seedPhraseCreatedAt) {
      return NextResponse.json(
        { error: 'No seed phrase has been set up. Use /setup to create one.' },
        { status: 400 }
      );
    }

    // Verify the code (TOTP if enabled)
    if (user.totpEnabledAt && user.totpSecret) {
      const secret = decryptTotpSecret(user.totpSecret);
      const isValid = verifyTotp(verificationCode, secret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }
    } else {
      // For users without TOTP, we can't reveal the seed phrase
      // since we don't store it
      return NextResponse.json(
        {
          error: 'Seed phrase reveal requires TOTP to be enabled. The seed phrase was shown only once during setup - if you lost it, you must use /regenerate to create a new one.',
        },
        { status: 400 }
      );
    }

    // IMPORTANT: We don't actually store the seed phrase!
    // This is by design for security - the user must write it down
    return NextResponse.json({
      success: false,
      message:
        'For security, seed phrases are not stored on our servers. They were shown only once during setup. If you lost your seed phrase but still have access to your account, you can regenerate a new one at /api/auth/seed-phrase/regenerate.',
      seedPhraseCreatedAt: user.seedPhraseCreatedAt,
    });
  } catch (error) {
    console.error('[Seed Phrase Reveal Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
