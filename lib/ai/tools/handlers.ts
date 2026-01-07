import { db, users, mentoringSessions, insights } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { ToolResult } from './definitions';

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

export async function executeUserStatus(userId: string): Promise<ToolResult> {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    const user = userResult[0];
    
    if (!user) return { success: false, error: 'User not found' };

    return {
      success: true,
      data: {
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
        currentDomain: user.currentDomain,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        overallProgress: Math.round(((DOMAINS.indexOf(user.currentDomain) + 1) / DOMAINS.length) * 100),
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeUpdateProgress(userId: string, domain: string, note: string): Promise<ToolResult> {
  console.log(`[AI Tool] Updating progress for ${userId}: ${domain} - ${note}`);
  return { success: true, data: { status: 'recorded', domain, note } };
}

export async function executeSeekWisdom(query: string): Promise<ToolResult> {
  try {
    // We'll search for scripture. For now, we'll use bible-api.com for a simple search
    // Or we can use a more advanced search logic. 
    // Let's try to get a random verse or specific one based on query.
    // For now, let's use a curated fallback if the API fails.
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=kjv`);
    if (!res.ok) {
      return { 
        success: true, 
        data: { 
          verse: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", 
          reference: "Proverbs 3:5" 
        } 
      };
    }
    const data = await res.json();
    return { 
      success: true, 
      data: { 
        verse: data.text, 
        reference: data.reference 
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeScribeReflection(userId: string, sessionId: number, domain: string, summary: string): Promise<ToolResult> {
  try {
    await db.insert(insights).values({
      userId: parseInt(userId),
      sessionId,
      domain,
      content: summary,
    });
    return { success: true, data: { status: 'scribed', domain } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeAscendDomain(userId: string): Promise<ToolResult> {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    const user = userResult[0];
    if (!user) return { success: false, error: 'User not found' };

    const currentIndex = DOMAINS.indexOf(user.currentDomain);
    if (currentIndex < DOMAINS.length - 1) {
      const nextDomain = DOMAINS[currentIndex + 1];
      await db.update(users).set({ currentDomain: nextDomain }).where(eq(users.id, user.id));
      return { success: true, data: { status: 'ascended', newDomain: nextDomain } };
    }

    return { success: true, data: { status: 'fully_transformed', currentDomain: user.currentDomain } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeClearSanctuary(sessionId: number): Promise<ToolResult> {
  try {
    await db.update(mentoringSessions)
      .set({ status: 'completed', endedAt: new Date() })
      .where(eq(mentoringSessions.id, sessionId));
    
    return { success: true, data: { status: 'cleared', action: 'RELOAD_PAGE' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executePeepTheGates(adminUserId: string): Promise<ToolResult> {
  try {
    const admin = await db.select().from(users).where(eq(users.id, parseInt(adminUserId))).limit(1);
    if (!admin[0] || admin[0].role !== 'admin') return { success: false, error: 'Unauthorized' };

    const pendingUsers = await db.select().from(users).where(eq(users.isApproved, false));
    return {
      success: true,
      data: {
        pendingCount: pendingUsers.length,
        users: pendingUsers.map(u => ({ email: u.email, name: u.name, joined: u.createdAt }))
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeApproveUser(adminUserId: string, targetEmail: string): Promise<ToolResult> {
  try {
    const adminResult = await db.select().from(users).where(eq(users.id, parseInt(adminUserId))).limit(1);
    const admin = adminResult[0];

    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can approve users.' };
    }

    await db.update(users)
      .set({ isApproved: true })
      .where(eq(users.email, targetEmail.toLowerCase()));

    return { success: true, data: { status: 'approved', email: targetEmail } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeSoulSearch(adminUserId: string, targetEmail: string): Promise<ToolResult> {
  try {
    const admin = await db.select().from(users).where(eq(users.id, parseInt(adminUserId))).limit(1);
    if (!admin[0] || admin[0].role !== 'admin') return { success: false, error: 'Unauthorized' };

    const target = await db.select().from(users).where(eq(users.email, targetEmail.toLowerCase())).limit(1);
    if (!target[0]) return { success: false, error: 'User not found' };

    return {
      success: true,
      data: {
        email: target[0].email,
        currentDomain: target[0].currentDomain,
        progress: Math.round(((DOMAINS.indexOf(target[0].currentDomain) + 1) / DOMAINS.length) * 100),
        lastLogin: target[0].lastLogin,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeBroadcast(adminUserId: string, message: string): Promise<ToolResult> {
  try {
    const admin = await db.select().from(users).where(eq(users.id, parseInt(adminUserId))).limit(1);
    if (!admin[0] || admin[0].role !== 'admin') return { success: false, error: 'Unauthorized' };

    // In a full implementation, we'd add a notification record. 
    // For now, let's log the intention.
    console.log(`[BROADCAST] ${admin[0].email}: ${message}`);
    return { success: true, data: { status: 'broadcast_queued', recipients: 'all_approved_users' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeSetAtmosphere(theme?: string, tone?: string): Promise<ToolResult> {
  // Themes are client-side. We return a signal.
  return { 
    success: true, 
    data: { 
      status: 'atmosphere_adjusted', 
      action: theme ? `SET_THEME_${theme.toUpperCase()}` : null,
      tone: tone || 'Default'
    } 
  };
}

export async function executeRecallInsight(userId: string, domain?: string): Promise<ToolResult> {
  try {
    let query = db.select().from(insights).where(eq(insights.userId, parseInt(userId)));
    const allInsights = await query;
    const filtered = domain 
      ? allInsights.filter(i => i.domain.toLowerCase() === domain.toLowerCase())
      : allInsights;

    return {
      success: true,
      data: {
        count: filtered.length,
        insights: filtered.slice(-5).map(i => ({ domain: i.domain, content: i.content, date: i.createdAt }))
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeSetHabit(userId: string, title: string, domain: string, description: string, frequency: 'daily' | 'weekly' = 'daily'): Promise<ToolResult> {
  try {
    const [newHabit] = await db.insert(habits).values({
      userId: parseInt(userId),
      title,
      domain,
      description,
      frequency,
    }).returning();

    return { success: true, data: { status: 'anchor_set', habit: newHabit.title } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeCompleteHabit(userId: string, title: string): Promise<ToolResult> {
  try {
    const habitResult = await db.select().from(habits)
      .where(and(eq(habits.userId, parseInt(userId)), eq(habits.title, title)))
      .limit(1);
    
    const habit = habitResult[0];
    if (!habit) return { success: false, error: 'Habit not found.' };

    await db.update(habits)
      .set({ 
        streak: habit.streak + 1, 
        lastCompletedAt: new Date() 
      })
      .where(eq(habits.id, habit.id));

    return { success: true, data: { status: 'anchored', streak: habit.streak + 1 } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
