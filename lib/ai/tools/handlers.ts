import { db, users, mentoringSessions } from '@/lib/db';
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
  // In a full implementation, we'd save the 'note' to a breakthroughs table.
  return { success: true, data: { status: 'recorded', domain, note } };
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
