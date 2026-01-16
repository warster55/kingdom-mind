import { NextResponse, type NextRequest } from 'next/server';

/**
 * Minimal middleware for Kingdom Mind production
 * Admin/Architect functionality has been moved to km-admin (port 8000)
 */
export function middleware(request: NextRequest) {
  // Currently no special route processing needed
  // All admin routes have been removed from production
  return NextResponse.next();
}

// No specific route matching needed - middleware passthrough
export const config = {
  matcher: [],
};
