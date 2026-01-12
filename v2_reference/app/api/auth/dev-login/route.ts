import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }

  const { email } = await req.json();
  const normalizedEmail = email.toLowerCase();

  // Create user if not exists
  let user = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1).then(r => r[0]);
  if (!user) {
    const [newUser] = await db.insert(users).values({
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      isApproved: true,
      role: 'user',
      onboardingStage: 0,
      hasCompletedOnboarding: false
    }).returning();
    user = newUser;
  }

  // Mint the JWT
  const token = await encode({
    token: {
      name: user.name,
      email: user.email,
      sub: user.id.toString(),
      role: user.role,
    },
    secret: process.env.NEXTAUTH_SECRET!,
  });

  const response = NextResponse.json({ success: true });
  
  // Set the session cookie
  response.cookies.set('next-auth.session-token', token, {
    httpOnly: true,
    secure: false, // Localhost is http
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
