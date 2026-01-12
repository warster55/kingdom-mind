import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, users } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. SECURITY: Verify Architect Role
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== 'architect' && userRole !== 'admin') {
      return NextResponse.json({ error: 'The Sanctuary is sealed.' }, { status: 401 });
    }

    // 2. DATA: Fetch The Galaxy
    // We want a list of "Stars" (Users) with their domain color and brightness (breakthroughs)
    const galaxyData = await db.execute(sql`
      SELECT 
        id, 
        current_domain as "domain", 
        (resonance_identity + resonance_purpose + resonance_mindset + resonance_relationships + resonance_vision + resonance_action + resonance_legacy) as "brightness"
      FROM users
      ORDER BY updated_at DESC
      LIMIT 1000
    `);

    // 3. STATS: High Level Metrics
    const userCountResult = await db.execute(sql`SELECT COUNT(*) FROM users`);
    const pendingCountResult = await db.execute(sql`SELECT COUNT(*) FROM users WHERE is_approved = false`);
    const activeResult = await db.execute(sql`SELECT COUNT(*) FROM mentoring_sessions WHERE started_at > NOW() - INTERVAL '24 hours'`);

    return NextResponse.json({
      stats: {
        totalSeekers: parseInt(userCountResult[0]?.count as string || '0'),
        waitingAtGates: parseInt(pendingCountResult[0]?.count as string || '0'),
        active24h: parseInt(activeResult[0]?.count as string || '0'),
      },
      galaxy: galaxyData // The array of stars (postgres-js returns rows directly)
    });

  } catch (error: any) {
    console.error('Architect Galaxy Error:', error);
    return NextResponse.json({ error: 'System Malfunction' }, { status: 500 });
  }
}
