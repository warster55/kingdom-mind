import { db, users, mentoringSessions, chatMessages, insights, habits } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { ReflectChat } from './ReflectChat';

export const dynamic = 'force-dynamic';

export default async function ReflectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/');
  }

  const userId = parseInt(session.user.id);

  try {
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];

    if (!user) redirect('/');

    const [activeSession] = await db
      .select()
      .from(mentoringSessions)
      .where(and(
        eq(mentoringSessions.userId, user.id),
        eq(mentoringSessions.status, 'active')
      ))
      .orderBy(desc(mentoringSessions.startedAt))
      .limit(1);

    let sessionId = activeSession?.id;

    if (!sessionId) {
      const [newSession] = await db.insert(mentoringSessions).values({
        userId: user.id,
        sessionNumber: 1,
        topic: 'Daily Reflection',
      }).returning();
      sessionId = newSession.id;
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
    });

    const initialMessages = messages.map(msg => ({
      id: msg.id.toString(),
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt,
    }));

    // Fetch Insights and Habits for the Vault portion of the Single Canvas
    const userInsights = await db.query.insights.findMany({
      where: eq(insights.userId, userId),
      orderBy: [desc(insights.createdAt)]
    });

    const userHabits = await db.query.habits.findMany({
      where: eq(habits.userId, userId),
      orderBy: [desc(habits.createdAt)]
    });

    return (
      <main className="flex flex-col h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-1000 overflow-hidden">
        <ReflectChat 
          sessionId={sessionId} 
          initialMessages={initialMessages} 
          user={user}
          insights={userInsights}
          habits={userHabits}
        />
      </main>
    );
  } catch (error) {
    console.error("Critical error in ReflectPage:", error);
    return (redirect('/'));
  }
}
