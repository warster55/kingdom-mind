import { db, users, insights, habits } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { VaultClient } from './VaultClient';

export default async function VaultPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/');

  const userId = parseInt(session.user.id);

  // 1. Fetch User
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  // 2. Fetch Insights (The Constellation)
  const userInsights = await db.query.insights.findMany({
    where: eq(insights.userId, userId),
    orderBy: [desc(insights.createdAt)]
  });

  // 3. Fetch Habits (Action Anchors)
  const userHabits = await db.query.habits.findMany({
    where: eq(habits.userId, userId),
    orderBy: [desc(habits.createdAt)]
  });

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-1000 overflow-hidden relative">
      <header className="absolute top-0 left-0 p-8 z-10 pointer-events-none">
        <h1 className="text-stone-300 dark:text-stone-700 text-[10px] uppercase tracking-[0.5em] font-bold">
          Kingdom Mind • The Vault
        </h1>
      </header>

      <VaultClient 
        user={user!} 
        insights={userInsights} 
        habits={userHabits} 
      />
    </main>
  );
}
