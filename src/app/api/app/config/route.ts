import { NextResponse } from 'next/server';

/**
 * GET /api/app/config
 * Returns client-side configuration overrides.
 * All config keys have defaults in components, so an empty object is valid.
 */
export async function GET() {
  // Return empty config - all keys have hardcoded defaults in components
  // Future: Could load from database app_config table if dynamic overrides needed
  return NextResponse.json({});
}
