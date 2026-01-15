import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashUsername, validateUsernameFormat } from '@/lib/auth/username-generator';
import { initializeTotpSetup } from '@/lib/auth/totp';
import { initializeSeedPhraseSetup } from '@/lib/auth/seed-phrase';

/**
 * POST /api/auth/register
 * Complete registration flow:
 * 1. User picks a username from the generated options
 * 2. System creates TOTP secret and QR code
 * 3. System generates seed phrase
 * 4. Returns all setup data to user (shown once!)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format (three words with hyphens)
    if (!validateUsernameFormat(username)) {
      return NextResponse.json(
        { error: 'Invalid username format. Must be three words separated by hyphens.' },
        { status: 400 }
      );
    }

    // Hash the username
    const usernameHash = hashUsername(username);

    // Check if username is already taken
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, usernameHash))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken. Please generate new options.' },
        { status: 400 }
      );
    }

    // Create the user first (we need the ID for TOTP and seed phrase setup)
    const [newUser] = await db
      .insert(users)
      .values({
        username: usernameHash,
        role: 'user',
        isApproved: true, // Auto-approve new users
        authMethod: 'totp',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: users.id });

    const userId = newUser.id;

    // Initialize TOTP
    const totpSetup = await initializeTotpSetup(userId);

    // Initialize seed phrase
    const seedPhraseSetup = initializeSeedPhraseSetup(userId);

    // Update user with TOTP and seed phrase data
    await db
      .update(users)
      .set({
        totpSecret: totpSetup.encryptedSecret,
        totpEnabledAt: new Date(),
        seedPhraseHash: seedPhraseSetup.seedPhraseHash,
        encryptedUserKey: seedPhraseSetup.encryptedUserKey,
        seedPhraseCreatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Return all the setup data
    // CRITICAL: This data is shown ONCE and must be written down!
    return NextResponse.json({
      success: true,
      userId,
      username,
      totp: {
        qrCode: totpSetup.qrCode,
        message: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)',
      },
      seedPhrase: {
        words: seedPhraseSetup.seedPhrase,
        wordCount: seedPhraseSetup.seedPhrase.split(' ').length,
        message: 'Write down these 24 words in order. This is your account recovery phrase.',
      },
      warnings: [
        'WRITE DOWN your username: ' + username,
        'SCAN the QR code with your authenticator app NOW',
        'WRITE DOWN all 24 seed phrase words in order',
        'This information will NOT be shown again',
        'If you lose this information, you will lose access to your account',
      ],
    });
  } catch (error) {
    console.error('[Registration Error]:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
