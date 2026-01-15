import { NextResponse } from 'next/server';
import { db, insights } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { decrypt } from '@/lib/utils/encryption';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== 'architect' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawInsights = await db.query.insights.findMany({
      orderBy: [desc(insights.createdAt)],
      limit: limit
    });

    // DECRYPT FOR ARCHITECT EYES
    const cleanInsights = rawInsights.map(i => ({
      ...i,
      content: decrypt(i.content)
    }));

    return NextResponse.json(cleanInsights);
  } catch (error: unknown) {
    console.error('Insights API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
