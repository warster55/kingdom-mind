import { db } from '@/lib/db';
import { appConfig } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const configRows = await db.select().from(appConfig);
    
    // Transform rows [ {key: 'k', value: 'v'} ] into a flat object { k: 'v' }
    // Note: value is jsonb which returns unknown, so we cast it
    const configMap = configRows.reduce((acc, row) => {
      acc[row.key] = row.value as string | number | boolean | null;
      return acc;
    }, {} as Record<string, string | number | boolean | null>);

    return NextResponse.json(configMap);
  } catch (error: unknown) {
    console.error('Config API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
