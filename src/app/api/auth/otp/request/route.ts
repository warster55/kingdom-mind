import { NextRequest, NextResponse } from 'next/server';
import { db, users, verificationCodes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { sendOTP } from '@/lib/email/ses';
import crypto from 'node:crypto';

/**
 * Creates a one-way SHA-256 hash of the email.
 * This ensures the database never stores the raw email identity.
 */
function hashEmail(email: string): string {
  const salt = process.env.IDENTITY_SALT || 'sanctuary-salt-v1';
  return crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const normalizedEmail = email.toLowerCase();
    const identityHash = hashEmail(normalizedEmail);
    
    console.log(`[Auth] Sovereign Request: ${identityHash.substring(0, 8)}...`);

    // 1. Check for Test Domain Bypass (@kingdomind.app)
    const isTestUser = normalizedEmail.endsWith('@kingdomind.app');

    // 2. Standard Logic: Check User via IDENTITY HASH
    const userResult = await db.select().from(users).where(eq(users.email, identityHash)).limit(1);
    let user = userResult[0];

    // --- LOCKDOWN MODE: BLOCK NEW USERS ---
    if (!user) {
       console.log(`[Auth] Blocked unknown seeker: ${email} -> Hash: ${identityHash}`); // DIAGNOSTIC LOG
       return NextResponse.json({ 
         error: 'The Sanctuary is currently preparing for launch. Access is limited to existing Architects.' 
       }, { status: 403 });
    }

    // 3. Generate and Send real OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store code against the HASH
    await db.insert(verificationCodes).values({
      email: identityHash,
      code,
      expiresAt,
    });

    // --- BYPASS LIST (No Email Needed) ---
    const bypassEmails = [
      'wmoore@securesentrypro.com',
      'melissa@securesentrypro.com',
      'grace.moore882@gmail.com'
    ];
    
    const isBypassUser = bypassEmails.includes(normalizedEmail) || isTestUser;
    const shouldSkipEmail = isBypassUser || (process.env.NODE_ENV === 'development');

    if (shouldSkipEmail) {
      console.log(`[Auth] Bypass detected for ${normalizedEmail}. Skipping email.`);
      return NextResponse.json({ success: true });
    }

    // SEND TO RAW EMAIL (Email only exists in this function's scope)
    try {
      const emailResult = await sendOTP(normalizedEmail, code);
      if (!emailResult.success) {
        // Log but don't crash if it's a known admin (redundancy check)
        console.error(`[Auth] SES Failed for ${normalizedEmail}`);
        return NextResponse.json({ error: 'Verification system unavailable.' }, { status: 500 });
      }
    } catch (e) {
      console.error('[Auth] Email Exception:', e);
      return NextResponse.json({ error: 'Email service error.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('OTP Request Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
