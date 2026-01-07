import { NextRequest, NextResponse } from 'next/server';
import { db, users, verificationCodes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { sendOTP } from '@/lib/email/ses';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const normalizedEmail = email.toLowerCase();

    // 1. Check Whitelist
    const userResult = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    const user = userResult[0];

    // If user exists and is NOT approved, we don't send the code
    if (user && !user.isApproved) {
      return NextResponse.json({ error: 'WAITLIST_ACTIVE' }, { status: 403 });
    }

    // If user doesn't exist, we'll allow sending code (registration flow), 
    // but the `authorize` callback will handle the final lock.
    // Actually, let's keep it tight: If not approved and not an admin email, block.
    const ADMIN_EMAILS = ['warren@securesentrypro.com', 'test@kingdommind.app', 'wmoore9706@gmail.com'];
    if (!user && !ADMIN_EMAILS.includes(normalizedEmail)) {
       // In a real production app, you might want to create them as pending here
       // or just block them. Let's block them if they aren't even in the system.
       // Actually, let's create them as pending so you can see them in your dashboard!
       await db.insert(users).values({
         email: normalizedEmail,
         name: normalizedEmail.split('@')[0],
         isApproved: false,
       }).onConflictDoNothing();
       
       return NextResponse.json({ error: 'WAITLIST_ACTIVE' }, { status: 403 });
    }

    // 2. Generate Code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Save Code
    await db.insert(verificationCodes).values({
      email: normalizedEmail,
      code,
      expiresAt,
    });

    // 4. Send Email
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
