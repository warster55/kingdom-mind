/**
 * Site Enable/Disable Proxy
 *
 * Next.js 16 proxy (formerly middleware) that checks if the site is enabled.
 * Runs on Node.js runtime, allowing direct database access.
 *
 * When site is disabled:
 * - Page requests are rewritten to /maintenance
 * - API requests receive a 503 JSON response via rewrite to maintenance API
 *
 * Default behavior: Site is enabled if config doesn't exist (fail open)
 */
import { NextResponse, type NextRequest } from 'next/server';
import { db, appConfig } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Cache configuration
const CACHE_TTL_MS = 5000; // 5 seconds

// In-memory cache for site status
let cachedStatus: { enabled: boolean; timestamp: number } | null = null;

/**
 * Check if site is enabled with caching
 */
async function isSiteEnabled(): Promise<boolean> {
  const now = Date.now();

  // Return cached value if fresh
  if (cachedStatus && (now - cachedStatus.timestamp) < CACHE_TTL_MS) {
    return cachedStatus.enabled;
  }

  try {
    const result = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, 'site_enabled'))
      .limit(1);

    // Default to enabled if no config exists
    if (!result.length) {
      cachedStatus = { enabled: true, timestamp: now };
      return true;
    }

    // Parse the value - expects { enabled: boolean }
    const config = result[0].value as { enabled?: boolean } | null;
    const enabled = config?.enabled !== false;

    cachedStatus = { enabled, timestamp: now };
    return enabled;
  } catch (error) {
    console.error('[proxy] Error checking site status:', error);
    // Fail open - if we can't check, allow access
    return true;
  }
}

// Paths that should never be blocked (static assets, maintenance page itself, health checks)
const BYPASS_PATHS = [
  '/maintenance',
  '/api/maintenance',
  '/api/health',     // Allow health checks during maintenance
  '/_next',
  '/favicon.ico',
  '/icon.svg',
  '/manifest.json',
  '/robots.txt',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow bypass paths
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if site is enabled
  const enabled = await isSiteEnabled();

  if (!enabled) {
    // Site is disabled - handle based on request type
    const isApiRequest = pathname.startsWith('/api');

    if (isApiRequest) {
      // Rewrite API requests to maintenance API endpoint
      const url = request.nextUrl.clone();
      url.pathname = '/api/maintenance';
      return NextResponse.rewrite(url);
    } else {
      // Rewrite page requests to maintenance page
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.rewrite(url);
    }
  }

  // Site is enabled - allow normal operation
  return NextResponse.next();
}

// Configure which paths this proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, etc. (static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|robots.txt).*)',
  ],
};
