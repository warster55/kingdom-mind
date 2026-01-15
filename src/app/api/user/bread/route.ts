import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users, userProgress, curriculum } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = parseInt(session.user.id);

    // 1. Get User Bread Status
    const userResult = await db.select({
      lastBreadAt: users.lastBreadAt,
      currentBreadId: users.currentBreadId
    }).from(users).where(eq(users.id, userId)).limit(1);

    const user = userResult[0];
    const now = new Date();
    const breadCooldown = 24 * 60 * 60 * 1000; // 24 Hours

    let activeBreadId = user?.currentBreadId;

    // 2. Check if we need to rotate the bread
    const needsNewBread = !user?.lastBreadAt || (now.getTime() - user.lastBreadAt.getTime() > breadCooldown);

    if (needsNewBread) {
      // Find the currently active pillar in their journey
      const progress = await db.select({
        curriculumId: userProgress.curriculumId
      }).from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.status, 'active')))
        .limit(1);

      if (progress[0]) {
        activeBreadId = progress[0].curriculumId;
        
        // Update user record
        await db.update(users).set({
          lastBreadAt: now,
          currentBreadId: activeBreadId
        }).where(eq(users.id, userId));
      }
    }

    // 3. Return Bread Data
    if (!activeBreadId) {
      return NextResponse.json({ message: 'No active mission yet.' });
    }

    const breadData = await db.select().from(curriculum).where(eq(curriculum.id, activeBreadId)).limit(1);

    return NextResponse.json({
      verse: breadData[0]?.coreVerse,
      truth: breadData[0]?.keyTruth,
      pillarName: breadData[0]?.pillarName,
      domain: breadData[0]?.domain,
      expiresIn: needsNewBread ? breadCooldown : (breadCooldown - (now.getTime() - (user?.lastBreadAt?.getTime() || 0)))
    });

  } catch (error: unknown) {
    console.error('Daily Bread API Error:', error);
    return NextResponse.json({ error: 'System Malfunction' }, { status: 500 });
  }
}
