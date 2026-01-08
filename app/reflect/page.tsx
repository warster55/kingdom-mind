import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { db, mentoringSessions, chatMessages, users } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { ReflectChat } from './ReflectChat';

export const dynamic = 'force-dynamic';

export default async function ReflectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/');
  }

  try {
    const userResult = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    let user = userResult[0];

    if (!user) {
      const [newUser] = await db.insert(users).values({
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
        hasCompletedOnboarding: false, // Force initiation for brand new user
      }).returning();
      user = newUser;
    }

    // 1. ALWAYS CREATE FRESH SESSION (The Fresh Breath)
    const [newSession] = await db.insert(mentoringSessions).values({
      userId: user.id,
      sessionNumber: (await db.$count(mentoringSessions, eq(mentoringSessions.userId, user.id))) + 1,
      topic: 'Daily Reflection',
      status: 'active'
    }).returning();

    // 2. PRE-SEED THE WELCOME (Instant On)
    // We don't call the AI here to save time/cost on server load. 
    // We insert a "System Welcome" that the UI renders immediately.
    const welcomeMsg = user.hasCompletedOnboarding 
      ? `Welcome back, ${user.name}. The stars are listening. What is on your heart today?`
      : `Welcome to the Sanctuary. I am the Mentor. What name shall I call you?`;

    await db.insert(chatMessages).values({
      sessionId: newSession.id,
      role: 'assistant',
      content: welcomeMsg
    });

    const initialMessages = [{
      id: 'welcome',
      role: 'assistant' as const,
      content: welcomeMsg,
      timestamp: new Date()
    }];

    // 3. FETCH RESONANCE (For the Map)
    const userInsights = await db.query.insights.findMany({
      where: eq(insights.userId, user.id),
      orderBy: [desc(insights.createdAt)]
    });

    const userHabits = await db.query.habits.findMany({
      where: eq(habits.userId, user.id),
      orderBy: [desc(habits.createdAt)]
    });

    // Simple System Prompt for the client (The real brain is in the API)
    const systemPrompt = "You are a wise strategist.";

    return (
      <main className="flex flex-col h-screen bg-stone-950 transition-colors duration-700 overflow-hidden">
        <ReflectChat 
          sessionId={newSession.id} 
          initialMessages={initialMessages} 
          user={user}
          insights={userInsights}
          habits={userHabits}
          systemPrompt={systemPrompt}
        />
      </main>
    );
  } catch (error) {
    console.error("Critical error in ReflectPage:", error);
    return (redirect('/'));
  }
}