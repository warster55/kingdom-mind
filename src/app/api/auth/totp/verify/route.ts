import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyTotp, decryptTotpSecret } from '@/lib/auth/totp';

/**
 * POST /api/auth/totp/verify
 * Verify a TOTP code and enable TOTP for the user
 * Called after user scans QR code and enters their first code
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

    // Get user's pending TOTP secret
    const [user] = await db
      .select({
        totpSecret: users.totpSecret,
        totpEnabledAt: users.totpEnabledAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.totpSecret) {
      return NextResponse.json(
        { error: 'No TOTP setup in progress. Call /api/auth/totp/setup first.' },
        { status: 400 }
      );
    }

    if (user.totpEnabledAt) {
      return NextResponse.json(
        { error: 'TOTP is already verified and enabled.' },
        { status: 400 }
      );
    }

    // Decrypt and verify the code
    const secret = decryptTotpSecret(user.totpSecret);
    const isValid = verifyTotp(code, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid code. Please try again.' },
        { status: 400 }
      );
    }

    // Enable TOTP for this user
    await db
      .update(users)
      .set({
        totpEnabledAt: new Date(),
        authMethod: 'totp',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'TOTP enabled successfully. You can now use your authenticator app to log in.',
    });
  } catch (error) {
    console.error('[TOTP Verify Error]:', error);
    return NextResponse.json(
      { error: 'Failed to verify TOTP code' },
      { status: 500 }
    );
  }
}
