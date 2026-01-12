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
    
    // Calculate Total AI Spend
    const costResult = await db.execute(sql`
      SELECT SUM(CAST(cost_metadata->>'cost_usd' AS FLOAT)) as total_cost 
      FROM chat_messages 
      WHERE cost_metadata IS NOT NULL
    `);

    const totalUsers = parseInt(userCountResult[0]?.count as string || '0');
    const waitingAtGates = parseInt(pendingCountResult[0]?.count as string || '0');
    const activeSessions24h = parseInt(sessionCountResult[0]?.count as string || '0');
    const totalAiCost = parseFloat(costResult[0]?.total_cost as string || '0').toFixed(4);

    return NextResponse.json({
      totalUsers,
      waitingAtGates,
      activeSessions24h,
      totalAiCost,
      status: 'Healthy'
    });
  } catch (error: any) {
    console.error('Health API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
