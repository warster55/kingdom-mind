import { NextRequest, NextResponse } from 'next/server';
import { db, users, verificationCodes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { sendOTP } from '@/lib/email/ses';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const normalizedEmail = email.toLowerCase();

    // 1. Check User in Database
    const userResult = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    let user = userResult[0];

    // 2. If user doesn't exist, create them as PENDING
    if (!user) {
       await db.insert(users).values({
         email: normalizedEmail,
         name: normalizedEmail.split('@')[0],
         isApproved: false,
         role: 'user'
       }).onConflictDoNothing();
       
       return NextResponse.json({ error: 'WAITLIST_ACTIVE' }, { status: 403 });
    }

    // 3. If user exists but is NOT approved, block code sending
    if (!user.isApproved) {
      return NextResponse.json({ error: 'WAITLIST_ACTIVE' }, { status: 403 });
    }

    // 4. Generate Code (Only for Approved Users)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 5. Save Code
    await db.insert(verificationCodes).values({
      email: normalizedEmail,
      code,
      expiresAt,
    });

    // 6. Send Email
    const emailResult = await sendOTP(normalizedEmail, code);
    if (!emailResult.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('OTP Request Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}