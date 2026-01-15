import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { validatePinFormat, createPinHash } from '@/lib/auth/pin';

/**
 * POST /api/auth/pin/setup
 * Set up a 6-digit PIN for quick session unlock
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

    if (!pin || !validatePinFormat(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Create hashed PIN
    const pinHash = createPinHash(pin);

    // Store the PIN hash
    await db
      .update(users)
      .set({
        pinHash,
        pinSetAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'PIN set successfully. You can use it to quickly unlock your session.',
    });
  } catch (error) {
    console.error('[PIN Setup Error]:', error);
    return NextResponse.json(
      { error: 'Failed to set PIN' },
      { status: 500 }
    );
  }
}
