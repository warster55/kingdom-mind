import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',

  // Disable X-Powered-By header (information disclosure)
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Enable HSTS (force HTTPS)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // XSS Protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy (disable unnecessary features)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
