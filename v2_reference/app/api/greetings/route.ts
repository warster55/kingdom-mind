import { db } from '@/lib/db';
import { greetings } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'LOGIN';

  try {
    // Pull a random active greeting of the specified type
    const [result] = await db
      .select({ content: greetings.content })
      .from(greetings)
      .where(and(
        eq(greetings.type, type),
        eq(greetings.isActive, true)
      ))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    return NextResponse.json({ 
      content: result?.content || "Peace be with you." 
    });
  } catch (error) {
    console.error('Greeting API Error:', error);
    return NextResponse.json({ content: "Peace be with you." });
  }
}
