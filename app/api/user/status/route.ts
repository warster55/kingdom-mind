import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userResult = await db.select().from(users).where(eq(users.id, parseInt(session.user.id))).limit(1);
    const user = userResult[0];

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

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
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}