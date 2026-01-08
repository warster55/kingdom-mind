
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1 as res`);
    return NextResponse.json({ status: 'ok', result });
  } catch (error: any) {
    console.error('DB HEALTH CHECK FAILED:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
