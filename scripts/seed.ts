import { db, users } from '../lib/db';

async function seed() {
  console.log("Seeding...");
  
  await db.insert(users).values({
    email: 'test@kingdommind.app',
    name: 'Test User',
    hasCompletedOnboarding: true,
  }).onConflictDoNothing();

  console.log("✅ Seeded test@kingdommind.app");
  process.exit(0);
}

seed();
