import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { runHealerLoop } from '@/lib/ai/agents/healer';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    // DEV OVERRIDE: Allow local access without admin check for testing
    if (process.env.NODE_ENV !== 'development' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Sovereign Access Only' }, { status: 403 });
    }

    const { issue } = await req.json();
    if (!issue) return NextResponse.json({ error: 'Issue description required' }, { status: 400 });

    const result = await runHealerLoop(issue);

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}