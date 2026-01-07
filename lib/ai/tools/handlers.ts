import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { ToolResult } from './definitions';

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
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        activeDomain: 'Identity',
        overallProgress: 15,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeUpdateProgress(userId: string, domain: string, note: string): Promise<ToolResult> {
  console.log(`[AI Tool] Updating progress for ${userId}: ${domain} - ${note}`);
  return { success: true, data: { status: 'recorded' } };
}

export async function executeApproveUser(adminUserId: string, targetEmail: string): Promise<ToolResult> {
  try {
    // 1. Verify caller is an admin
    const adminResult = await db.select().from(users).where(eq(users.id, parseInt(adminUserId))).limit(1);
    const admin = adminResult[0];

    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can approve users.' };
    }

    // 2. Approve the user
    await db.update(users)
      .set({ isApproved: true })
      .where(eq(users.email, targetEmail.toLowerCase()));

    console.log(`[AI Tool] Admin ${admin.email} approved user: ${targetEmail}`);
    return { success: true, data: { status: 'approved', email: targetEmail } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}