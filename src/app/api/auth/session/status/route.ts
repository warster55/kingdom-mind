import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users, webauthnCredentials } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Session lock tiers (in milliseconds)
const LOCK_TIERS = {
  NONE: 5 * 60 * 1000, // 0-5 min: no lock
  PIN_OR_BIOMETRIC: 30 * 60 * 1000, // 5-30 min: PIN or biometric
  PIN_PLUS_TOTP: 24 * 60 * 60 * 1000, // 30 min - 24 hr: PIN + TOTP
  FULL_LOGIN: Infinity, // 24+ hr: full login required
};

export type LockLevel = 'none' | 'biometric' | 'pin' | 'pin_plus_totp' | 'full_login';

/**
 * GET /api/auth/session/status
 * Check session lock status and return required unlock method
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        authenticated: false,
        lockLevel: 'full_login' as LockLevel,
        message: 'Not authenticated',
      });
    }

    const userId = parseInt(session.user.id as string, 10);

    // Get user data
    const [user] = await db
      .select({
        lastActivityAt: users.lastActivityAt,
        pinHash: users.pinHash,
        totpEnabledAt: users.totpEnabledAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Check if user has passkeys
    const passkeys = await db
      .select({ id: webauthnCredentials.id })
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.userId, userId))
      .limit(1);

    const hasPasskey = passkeys.length > 0;
    const hasPin = !!user?.pinHash;
    const hasTotp = !!user?.totpEnabledAt;

    // Calculate idle time
    const lastActivity = user?.lastActivityAt || new Date(0);
    const idleTime = Date.now() - lastActivity.getTime();

    // Determine lock level
    let lockLevel: LockLevel = 'none';

    if (idleTime > LOCK_TIERS.PIN_PLUS_TOTP) {
      // More than 24 hours - full login required
      lockLevel = 'full_login';
    } else if (idleTime > LOCK_TIERS.PIN_OR_BIOMETRIC) {
      // 30 min - 24 hr - PIN + TOTP required
      lockLevel = 'pin_plus_totp';
    } else if (idleTime > LOCK_TIERS.NONE) {
      // 5-30 min - PIN or biometric required
      lockLevel = hasPasskey ? 'biometric' : 'pin';
    }

    // Update last activity for active sessions
    if (lockLevel === 'none') {
      await db
        .update(users)
        .set({ lastActivityAt: new Date() })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      authenticated: true,
      lockLevel,
      idleMinutes: Math.floor(idleTime / 60000),
      availableMethods: {
        biometric: hasPasskey,
        pin: hasPin,
        totp: hasTotp,
      },
      message: getLockMessage(lockLevel),
    });
  } catch (error) {
    console.error('[Session Status Error]:', error);
    return NextResponse.json(
      { error: 'Failed to check session status' },
      { status: 500 }
    );
  }
}

function getLockMessage(level: LockLevel): string {
  switch (level) {
    case 'none':
      return 'Session active';
    case 'biometric':
      return 'Use fingerprint or face to unlock';
    case 'pin':
      return 'Enter your PIN to unlock';
    case 'pin_plus_totp':
      return 'Enter your PIN and TOTP code to unlock';
    case 'full_login':
      return 'Session expired. Please log in again.';
  }
}
