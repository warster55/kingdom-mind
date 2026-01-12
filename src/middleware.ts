import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect Architect routes
  if (path.startsWith('/api/architect') || path.startsWith('/architect')) {
    const allowedIp = process.env.ARCHITECT_ALLOWED_IP;
    
    // In production, Cloudflare usually sends the IP in 'cf-connecting-ip' or 'x-forwarded-for'
    const clientIp = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     'unknown';

    console.log(`[Security] Architect Access Attempt: ${clientIp} on ${path}`);

    // If we have a whitelist, enforce it
    if (allowedIp && clientIp !== allowedIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
      console.warn(`[Security] 🚫 BLOCKED: Unauthorized IP ${clientIp}`);
      return new NextResponse(
        JSON.stringify({ error: 'Sovereign Access Denied: Unauthorized Location.' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

// Only run middleware on architect paths to maximize performance
export const config = {
  matcher: ['/architect/:path*', '/api/architect/:path*'],
};
