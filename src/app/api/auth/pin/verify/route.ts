import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { validatePinFormat, verifyPinHash } from '@/lib/auth/pin';

// Track failed attempts (in production, use Redis)
const failedAttempts = new Map<number, { count: number; lockedUntil?: Date }>();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/auth/pin/verify
 * Verify PIN for session unlock
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);
    const body = await request.json();
    const { pin } = body;

    // Check for lockout
    const attempts = failedAttempts.get(userId);
    if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil(
        (attempts.lockedUntil.getTime() - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${remainingSeconds} seconds.`,
          locked: true,
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    if (!pin || !validatePinFormat(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Get user's PIN hash
    const [user] = await db
      .select({ pinHash: users.pinHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.pinHash) {
      return NextResponse.json(
        { error: 'No PIN set. Please set up a PIN first.' },
        { status: 400 }
      );
    }

    // Verify PIN
    const isValid = verifyPinHash(pin, user.pinHash);

    if (!isValid) {
      // Track failed attempt
      const currentAttempts = failedAttempts.get(userId) || { count: 0 };
      currentAttempts.count++;

      if (currentAttempts.count >= MAX_ATTEMPTS) {
        currentAttempts.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
        failedAttempts.set(userId, currentAttempts);
        return NextResponse.json(
          {
            error: 'Too many failed attempts. Account locked for 5 minutes.',
            locked: true,
            requiresTotp: true,
          },
          { status: 429 }
        );
      }

      failedAttempts.set(userId, currentAttempts);
      return NextResponse.json(
        {
          error: 'Invalid PIN',
          attemptsRemaining: MAX_ATTEMPTS - currentAttempts.count,
        },
        { status: 400 }
      );
    }

    // Success - clear failed attempts
    failedAttempts.delete(userId);

    // Update last activity
    await db
      .update(users)
      .set({ lastActivityAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Session unlocked',
    });
  } catch (error) {
    console.error('[PIN Verify Error]:', error);
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}
