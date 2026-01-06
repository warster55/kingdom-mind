import { db, users, mentoringSessions, chatMessages } from '../lib/db';
import { eq } from 'drizzle-orm';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create-user':
      const email = args[1] || 'test@kingdommind.app';
      await db.insert(users).values({
        email,
        name: 'Test User',
        hasCompletedOnboarding: true,
      }).onConflictDoNothing();
      console.log(`User ${email} created/verified.`);
      break;

    case 'prepare-session':
      const userEmail = args[1] || 'test@kingdommind.app';
      const [user] = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
      if (!user) throw new Error("User not found");

      const [session] = await db.insert(mentoringSessions).values({
        userId: user.id,
        sessionNumber: 1,
        topic: 'Test Session',
        status: 'active',
      }).returning();

      console.log(JSON.stringify({ sessionId: session.id }));
      break;

    case 'cleanup':
      const cleanupEmail = args[1];
      if (cleanupEmail) {
        const [u] = await db.select().from(users).where(eq(users.email, cleanupEmail)).limit(1);
        if (u) {
          await db.delete(users).where(eq(users.id, u.id));
          console.log(`Cleaned up user ${cleanupEmail}`);
        }
      }
      break;

    default:
      console.log("Usage: test-factory <create-user|prepare-session|cleanup> [args]");
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});