import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { db, mentoringSessions, chatMessages, users, insights, habits, systemPrompts } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { ReflectChat } from './ReflectChat';
import { buildSanctuaryPrompt } from '@/lib/ai/system-prompt';

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
        hasCompletedOnboarding: false, 
      }).returning();
      user = newUser;
    }

    // 1. GET PREVIOUS CONTEXT (The "Memory")
    // We look for the last session to feed its context to the new one
    const [lastSession] = await db.select().from(mentoringSessions)
      .where(eq(mentoringSessions.userId, user.id))
      .orderBy(desc(mentoringSessions.startedAt))
      .limit(1);

    let lastContext = "";
    if (lastSession) {
      const lastMsgs = await db.select().from(chatMessages)
        .where(eq(chatMessages.sessionId, lastSession.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(2); // Get last exchange
      if (lastMsgs.length > 0) {
        lastContext = lastMsgs.map(m => `${m.role}: ${m.content}`).join('\n');
      }
    }

    // 2. ALWAYS CREATE FRESH SESSION (The Fresh Breath)
    const [newSession] = await db.insert(mentoringSessions).values({
      userId: user.id,
      sessionNumber: (await db.$count(mentoringSessions, eq(mentoringSessions.userId, user.id))) + 1,
      topic: 'Daily Reflection',
      status: 'active'
    }).returning();

    // 3. PRE-SEED THE WELCOME (Instant On)
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

    // 4. FETCH RESONANCE (For the Map)
    const userInsights = await db.query.insights.findMany({
      where: eq(insights.userId, user.id),
      orderBy: [desc(insights.createdAt)]
    });

    const userHabits = await db.query.habits.findMany({
      where: eq(habits.userId, user.id),
      orderBy: [desc(habits.createdAt)]
    });

    // 5. BUILD SMART PROMPT (Injecting Memory)
    // We fetch the prompt logic here to hydrate the client with the "Brain" state
    const dbPrompt = await db.select().from(systemPrompts)
      .where(eq(systemPrompts.isActive, true))
      .orderBy(desc(systemPrompts.createdAt))
      .limit(1);

    const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];
    const userLocalTime = new Date().toLocaleString("en-US", { timeZone: user.timezone || 'UTC' });

    const systemPrompt = buildSanctuaryPrompt({
      userName: user.name || "Seeker",
      currentDomain: user.currentDomain,
      progress: Math.round(((DOMAINS.indexOf(user.currentDomain) + 1) / DOMAINS.length) * 100),
      lastInsight: userInsights[0]?.content,
      localTime: userLocalTime,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      baseInstructions: dbPrompt[0]?.content
    });

    // Append the "Recent Memory" to the system prompt so the AI knows where we left off
    // without cluttering the visible chat.
    const augmentedPrompt = lastContext 
      ? `${systemPrompt}\n\n### RECENT MEMORY (The user just left off here):\n${lastContext}`
      : systemPrompt;

    return (
      <main className="flex flex-col h-screen bg-stone-950 transition-colors duration-700 overflow-hidden">
        <ReflectChat 
          sessionId={newSession.id} 
          initialMessages={initialMessages} 
          user={user}
          insights={userInsights}
          habits={userHabits}
          systemPrompt={augmentedPrompt}
        />
      </main>
    );
  } catch (error) {
    console.error("Critical error in ReflectPage:", error);
    return (redirect('/'));
  }
}
