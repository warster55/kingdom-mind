import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { db, mentoringSessions, chatMessages, users, insights, habits, systemPrompts, greetings } from '@/lib/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { ReflectChat } from '@/app/reflect/ReflectChat';
import { RootChat } from '@/components/chat/RootChat';
import { buildSanctuaryPrompt } from '@/lib/ai/system-prompt';

export const dynamic = 'force-dynamic';

function serialize(obj: any) {
  if (obj === undefined || obj === null) return null;
  return JSON.parse(JSON.stringify(obj));
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <RootChat />;
  }

  try {
    const userResult = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    let user = userResult[0];

    if (!user) {
      const [newUser] = await db.insert(users).values({
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
        hasCompletedOnboarding: false, 
        preferences: {}
      }).returning();
      user = newUser;
    }

    // 1. GET PREVIOUS CONTEXT
    const [lastSession] = await db.select().from(mentoringSessions)
      .where(eq(mentoringSessions.userId, user.id))
      .orderBy(desc(mentoringSessions.startedAt))
      .limit(1);

    let lastContext = "";
    if (lastSession) {
      const lastMsgs = await db.select().from(chatMessages)
        .where(eq(chatMessages.sessionId, lastSession.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(2);
      if (lastMsgs && lastMsgs.length > 0) {
        lastContext = lastMsgs.map(m => `${m.role}: ${m.content}`).join('\n');
      }
    }

    // 2. CREATE FRESH SESSION
    const [newSession] = await db.insert(mentoringSessions).values({
      userId: user.id,
      sessionNumber: (await db.$count(mentoringSessions, eq(mentoringSessions.userId, user.id))) + 1,
      topic: 'Daily Reflection',
      status: 'active'
    }).returning();

    // 3. FETCH DYNAMIC WELCOME
    let welcomeMsg = "Welcome to the Sanctuary. I am the Mentor. What name shall I call you?";
    
    if (user.hasCompletedOnboarding) {
      const [dbGreeting] = await db
        .select({ content: greetings.content })
        .from(greetings)
        .where(and(eq(greetings.type, 'RETURN_USER'), eq(greetings.isActive, true)))
        .orderBy(sql`RANDOM()`)
        .limit(1);
      
      if (dbGreeting?.content) {
        welcomeMsg = dbGreeting.content.replace('{name}', user.name?.split(' ')[0] || 'friend');
      } else {
        welcomeMsg = `Welcome back, ${user.name || 'friend'}. What is on your heart today?`;
      }
    }

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

    // 4. FETCH RESONANCE (Safe Fetching)
    const rawInsights = await db.query.insights.findMany({
      where: eq(insights.userId, user.id),
      orderBy: [desc(insights.createdAt)]
    }) || [];

    const rawHabits = await db.query.habits.findMany({
      where: eq(habits.userId, user.id),
      orderBy: [desc(habits.createdAt)]
    }) || [];

    // 5. BUILD SMART PROMPT
    const dbPrompt = await db.select().from(systemPrompts)
      .where(eq(systemPrompts.isActive, true))
      .orderBy(desc(systemPrompts.createdAt))
      .limit(1);

    const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];
    const userLocalTime = new Date().toLocaleString("en-US", { timeZone: user.timezone || 'UTC' });

    const currentDomainIndex = DOMAINS.indexOf(user.currentDomain || 'Identity');
    const safeProgress = currentDomainIndex >= 0 ? Math.round(((currentDomainIndex + 1) / DOMAINS.length) * 100) : 0;

    const systemPrompt = await buildSanctuaryPrompt({
      userName: user.name || "Seeker",
      userId: user.id,
      currentDomain: user.currentDomain || 'Identity',
      progress: safeProgress,
      lastInsight: rawInsights[0]?.content,
      localTime: userLocalTime,
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      onboardingStage: user.onboardingStage || 0,
      baseInstructions: dbPrompt[0]?.content || "You are a helpful mentor."
    });

    const augmentedPrompt = lastContext 
      ? `${systemPrompt}\n\n### RECENT MEMORY (The user just left off here):\n${lastContext}`
      : systemPrompt;

    // SERIALIZE PROPS (CRITICAL FIX)
    // Convert Date objects to strings by JSON cycling
    const cleanUser = serialize(user);
    const cleanInsights = serialize(rawInsights);
    const cleanHabits = serialize(rawHabits);
    const cleanMessages = serialize(initialMessages);

    return (
      <main className="flex flex-col h-screen bg-stone-950 transition-colors duration-700 overflow-hidden">
        <ReflectChat 
          sessionId={newSession.id} 
          initialMessages={cleanMessages} 
          user={cleanUser}
          insights={cleanInsights}
          habits={cleanHabits}
          systemPrompt={augmentedPrompt}
        />
      </main>
    );
  } catch (error) {
    console.error("Critical error in Home Page:", error);
    return <RootChat />;
  }
}
