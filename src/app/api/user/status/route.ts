import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users, userProgress, curriculum } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

export async function GET(req: NextRequest) {
  try {
    let userId: string | undefined;

    // 1. Standard Session Check
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }

    // 2. Test Bypass (Dev Only)
    const testEmail = req.headers.get('x-test-email');
    if (!userId && testEmail && process.env.NODE_ENV === 'development') {
      const user = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
      if (user[0]) userId = user[0].id.toString();
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userIdInt = parseInt(userId);
    const userResult = await db.select().from(users).where(eq(users.id, userIdInt)).limit(1);
    const user = userResult[0];

    if (!user) return NextResponse.json({ error: 'User not found - Session Invalid' }, { status: 401 });

    // Fetch Curriculum Progress
    const progress = await db.select({
      pillarName: curriculum.pillarName,
      domain: curriculum.domain,
      status: userProgress.status,
      order: curriculum.pillarOrder
    })
    .from(userProgress)
    .innerJoin(curriculum, eq(userProgress.curriculumId, curriculum.id))
    .where(eq(userProgress.userId, user.id))
    .orderBy(asc(curriculum.pillarOrder));

    return NextResponse.json({
      role: user.role, // CRITICAL FIX: Include the role for Architect mode
      activeDomain: user.currentDomain,
      onboardingStage: user.onboardingStage, 
      progress: Math.round(((DOMAINS.indexOf(user.currentDomain) + 1) / DOMAINS.length) * 100),
      domains: DOMAINS,
      resonance: {
        Identity: user.resonanceIdentity,
        Purpose: user.resonancePurpose,
        Mindset: user.resonanceMindset,
        Relationships: user.resonanceRelationships,
        Vision: user.resonanceVision,
        Action: user.resonanceAction,
        Legacy: user.resonanceLegacy,
      },
      curriculum: progress
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
