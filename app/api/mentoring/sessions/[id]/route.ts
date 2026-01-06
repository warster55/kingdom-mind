import { NextRequest, NextResponse } from 'next/server';
import { db, mentoringSessions } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    await db.update(mentoringSessions)
      .set({
        ...body,
        endedAt: body.status === 'completed' ? new Date() : undefined,
      })
      .where(eq(mentoringSessions.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
