import { NextResponse } from 'next/server';
import { generateUsernames, hashUsername } from '@/lib/auth/username-generator';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/auth/username/generate
 * Generate 3 random usernames for new user registration
 * Ensures none of the generated usernames are already taken
 */
export async function GET() {
  try {
    const maxAttempts = 10;
    let attempts = 0;
    const availableUsernames: string[] = [];

    while (availableUsernames.length < 3 && attempts < maxAttempts) {
      attempts++;
      const candidates = generateUsernames(3);

      for (const username of candidates) {
        if (availableUsernames.length >= 3) break;

        // Check if username is already taken
        const hash = hashUsername(username);
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, hash))
          .limit(1);

        if (existing.length === 0) {
          availableUsernames.push(username);
        }
      }
    }

    if (availableUsernames.length < 3) {
      // Extremely unlikely, but handle it
      console.error('[Username Gen] Could not generate 3 unique usernames');
      return NextResponse.json(
        { error: 'Unable to generate usernames. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usernames: availableUsernames,
      message: 'Pick one of these usernames. Write it down - you will need it to log in.',
    });
  } catch (error) {
    console.error('[Username Generate Error]:', error);
    return NextResponse.json(
      { error: 'Failed to generate usernames' },
      { status: 500 }
    );
  }
}
