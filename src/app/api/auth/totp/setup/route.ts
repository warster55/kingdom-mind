import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { initializeTotpSetup } from '@/lib/auth/totp';

/**
 * POST /api/auth/totp/setup
 * Generate TOTP secret and QR code for the authenticated user
 * Returns the QR code for scanning with an authenticator app
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);

    // Check if user already has TOTP enabled
    const [user] = await db
      .select({ totpEnabledAt: users.totpEnabledAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.totpEnabledAt) {
      return NextResponse.json(
        { error: 'TOTP is already enabled. Disable it first to reconfigure.' },
        { status: 400 }
      );
    }

    // Generate TOTP setup data
    const { qrCode, encryptedSecret } = await initializeTotpSetup(userId);

    // Store the encrypted secret temporarily (not enabled yet)
    // User must verify with a valid code before TOTP is fully enabled
    await db
      .update(users)
      .set({
        totpSecret: encryptedSecret,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      qrCode,
      message: 'Scan this QR code with your authenticator app, then verify with a code.',
    });
  } catch (error) {
    console.error('[TOTP Setup Error]:', error);
    return NextResponse.json(
      { error: 'Failed to initialize TOTP setup' },
      { status: 500 }
    );
  }
}
