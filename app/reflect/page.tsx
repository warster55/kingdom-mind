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
    // 1. Ensure user exists in our DB (NextAuth might have it in session but not yet in our users table)
    const userResult = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    let user = userResult[0];

    if (!user) {
      const [newUser] = await db.insert(users).values({
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
        hasCompletedOnboarding: true,
      }).returning();
      user = newUser;
    }

    // 2. Get/Create Active Session
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

    // 3. Fetch Messages
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

    const systemPrompt = "You are a wise and compassionate mentor helping the user find peace and transformation. Keep responses concise and focused on the user's journey.";

    return (
      <main className="flex flex-col h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-700 overflow-hidden">
        <ReflectChat 
          sessionId={sessionId} 
          initialMessages={initialMessages} 
          systemPrompt={systemPrompt}
        />
      </main>
    );
  } catch (error) {
    console.error("Critical error in ReflectPage:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950 p-8 text-center font-serif">
        <h1 className="text-2xl text-stone-800 dark:text-stone-100 mb-4 italic">Entering the Sanctuary...</h1>
        <p className="text-stone-500 dark:text-stone-400">Peace be with you. We are preparing your space.</p>
        {/* Auto-refresh after 3 seconds to try again */}
        <script dangerouslySetInnerHTML={{ __html: 'setTimeout(() => window.location.reload(), 3000)' }} />
      </div>
    );
  }
}