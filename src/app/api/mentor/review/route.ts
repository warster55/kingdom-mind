/**
 * Mentor Review API
 *
 * Triggers AI self-review for a mentoring session.
 * Can be called manually or automatically after sessions end.
 */

import { NextResponse } from 'next/server';
import { triggerSessionReview } from '@/lib/ai/self-review';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== 'number') {
      return NextResponse.json(
        { error: 'Valid sessionId required' },
        { status: 400 }
      );
    }

    console.log(`[Mentor Review API] Review requested for session ${sessionId}`);

    const success = await triggerSessionReview(sessionId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Session ${sessionId} reviewed successfully`,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Session not eligible for review or already reviewed',
      });
    }
  } catch (error) {
    console.error('[Mentor Review API] Error:', error);
    return NextResponse.json(
      { error: 'Review failed' },
      { status: 500 }
    );
  }
}
