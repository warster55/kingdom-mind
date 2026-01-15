import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyTotp, decryptTotpSecret } from '@/lib/auth/totp';

/**
 * POST /api/auth/totp/disable
 * Disable TOTP for the authenticated user
 * Requires a valid TOTP code to confirm ownership
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid code format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Get user's TOTP secret
    const [user] = await db
      .select({
        totpSecret: users.totpSecret,
        totpEnabledAt: users.totpEnabledAt,
        seedPhraseHash: users.seedPhraseHash,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.totpEnabledAt || !user?.totpSecret) {
      return NextResponse.json(
        { error: 'TOTP is not enabled for this account.' },
        { status: 400 }
      );
    }

    // Verify the code before disabling
    const secret = decryptTotpSecret(user.totpSecret);
    const isValid = verifyTotp(code, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid code. Cannot disable TOTP without valid verification.' },
        { status: 400 }
      );
    }

    // Determine fallback auth method
    const newAuthMethod = user.seedPhraseHash ? 'seed_phrase' : 'email_otp';

    // Disable TOTP
    await db
      .update(users)
      .set({
        totpSecret: null,
        totpEnabledAt: null,
        authMethod: newAuthMethod,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: `TOTP disabled. Authentication method changed to ${newAuthMethod}.`,
    });
  } catch (error) {
    console.error('[TOTP Disable Error]:', error);
    return NextResponse.json(
      { error: 'Failed to disable TOTP' },
      { status: 500 }
    );
  }
}
