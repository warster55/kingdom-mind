import { db } from '@/lib/db';
import { appConfig } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const configRows = await db.select().from(appConfig);
    
    // Transform rows [ {key: 'k', value: 'v'} ] into a flat object { k: 'v' }
    const configMap = configRows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(configMap);
  } catch (error: any) {
    console.error('Config API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
