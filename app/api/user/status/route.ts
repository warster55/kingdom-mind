import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users, userProgress, curriculum } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userResult = await db.select().from(users).where(eq(users.id, parseInt(session.user.id))).limit(1);
    const user = userResult[0];

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

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
      activeDomain: user.currentDomain,
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}