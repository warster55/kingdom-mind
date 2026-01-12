import { db, systemPrompts, users, mentoringSessions, chatMessages, insights } from '@/lib/db';
import { eq, desc, sql as drizzleSql } from 'drizzle-orm';
import { ToolResult } from './definitions';

export async function executeArchitectQuery(sql: string): Promise<ToolResult> {
  try {
    // SECURITY: Ensure query is read-only
    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'];
    const isForbidden = forbidden.some(word => sql.toUpperCase().includes(word));
    
    if (isForbidden) {
      return { success: false, error: 'Access Denied: Only SELECT queries are permitted in Sovereignty Mode.' };
    }

    // Execute raw SQL using drizzle
    const result = await db.execute(drizzleSql.raw(sql));
    
    return {
      success: true,
      data: result.rows || result
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeUpdatePrompt(newPrompt: string, explanation: string): Promise<ToolResult> {
  try {
    const lastVersionResult = await db.select().from(systemPrompts)
      .orderBy(desc(systemPrompts.version))
      .limit(1);
    
    const nextVersion = (lastVersionResult[0]?.version || 0) + 1;

    await db.insert(systemPrompts).values({
      version: nextVersion,
      content: newPrompt,
      changeLog: explanation,
      isActive: true
    });

    return { success: true, data: { version: nextVersion, status: 'deployed' } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeSystemHealth(): Promise<ToolResult> {
  try {
    const userCount = await db.execute(drizzleSql`SELECT COUNT(*) FROM users`);
    const pendingCount = await db.execute(drizzleSql`SELECT COUNT(*) FROM users WHERE is_approved = false`);
    const sessionCount = await db.execute(drizzleSql`SELECT COUNT(*) FROM mentoring_sessions WHERE started_at > NOW() - INTERVAL '24 hours'`);

    return {
      success: true,
      data: {
        totalUsers: userCount.rows[0].count,
        waitingAtGates: pendingCount.rows[0].count,
        activeSessions24h: sessionCount.rows[0].count,
        status: 'Healthy'
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
