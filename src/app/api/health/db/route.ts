import { NextResponse } from 'next/server';
import { db, users, mentoringSessions } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    // Only Architects can see the system pulse
    if (userRole !== 'architect' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userCountResult = await db.execute(sql`SELECT COUNT(*) FROM users`);
    const pendingCountResult = await db.execute(sql`SELECT COUNT(*) FROM users WHERE is_approved = false`);
    const sessionCountResult = await db.execute(sql`SELECT COUNT(*) FROM mentoring_sessions WHERE started_at > NOW() - INTERVAL '24 hours'`);

    const totalUsers = parseInt(userCountResult.rows[0]?.count as string || '0');
    const waitingAtGates = parseInt(pendingCountResult.rows[0]?.count as string || '0');
    const activeSessions24h = parseInt(sessionCountResult.rows[0]?.count as string || '0');

    return NextResponse.json({
      totalUsers,
      waitingAtGates,
      activeSessions24h,
      status: 'Healthy'
    });
  } catch (error: any) {
    console.error('Health API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
