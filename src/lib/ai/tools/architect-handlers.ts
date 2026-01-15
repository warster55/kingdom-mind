import { db, systemPrompts } from '@/lib/db';
import { desc, sql as drizzleSql } from 'drizzle-orm';
import { ToolResult } from './architect-definitions';
import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';
import * as path from 'path';

const execPromise = promisify(exec);

// Project root for file operations security
const PROJECT_ROOT = process.cwd();

export async function executeArchitectQuery(sql: string): Promise<ToolResult> {
  try {
    // SECURITY: Normalize and validate query
    const normalizedSql = sql.trim();

    // Must start with SELECT (case-insensitive)
    if (!/^\s*SELECT\s/i.test(normalizedSql)) {
      return { success: false, error: 'Access Denied: Only SELECT queries are permitted in Sovereignty Mode.' };
    }

    // Forbidden keywords with word boundary matching (case-insensitive)
    const forbidden = [
      'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE',
      'GRANT', 'REVOKE', 'CREATE', 'EXEC', 'EXECUTE', 'UNION',
      'INTO\\s+OUTFILE', 'INTO\\s+DUMPFILE', 'LOAD_FILE'
    ];

    // Check for forbidden patterns with word boundaries
    const forbiddenRegex = new RegExp(`\\b(${forbidden.join('|')})\\b`, 'i');
    if (forbiddenRegex.test(normalizedSql)) {
      return { success: false, error: 'Access Denied: Query contains forbidden keywords.' };
    }

    // Block SQL comments that could hide malicious code
    if (/--/.test(normalizedSql) || /\/\*/.test(normalizedSql)) {
      return { success: false, error: 'Access Denied: SQL comments are not permitted.' };
    }

    // Block semicolons to prevent query stacking
    if (/;/.test(normalizedSql.slice(0, -1))) { // Allow trailing semicolon only
      return { success: false, error: 'Access Denied: Multiple statements are not permitted.' };
    }

    // Execute raw SQL using drizzle
    const result = await db.execute(drizzleSql.raw(normalizedSql));

    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
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
        totalUsers: userCount[0].count,
        waitingAtGates: pendingCount[0].count,
        activeSessions24h: sessionCount[0].count,
        status: 'Healthy'
      }
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ============================================
// FILE OPERATIONS (CLI Power)
// ============================================

/**
 * Validates that a path is within the project root (security)
 */
function validatePath(inputPath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, inputPath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error('Path escape attempt blocked: path must be within project root');
  }
  return resolved;
}

export async function executeReadFile(
  filePath: string,
  startLine?: number,
  endLine?: number
): Promise<ToolResult> {
  try {
    const safePath = validatePath(filePath);
    const content = await readFile(safePath, 'utf-8');
    const lines = content.split('\n');

    // Handle line range (1-indexed for user-friendliness)
    const start = startLine ? Math.max(0, startLine - 1) : 0;
    const end = endLine ? Math.min(lines.length, endLine) : Math.min(lines.length, 500);

    // Format with line numbers
    const result = lines
      .slice(start, end)
      .map((line, i) => `${start + i + 1}: ${line}`)
      .join('\n');

    const truncatedNote = lines.length > 500 && !endLine
      ? `\n\n[File truncated: showing lines 1-500 of ${lines.length}. Use startLine/endLine to read more.]`
      : '';

    return {
      success: true,
      data: result + truncatedNote
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function executeWriteFile(filePath: string, content: string): Promise<ToolResult> {
  try {
    const safePath = validatePath(filePath);
    await writeFile(safePath, content, 'utf-8');
    return {
      success: true,
      data: `Written ${content.length} bytes to ${filePath}`
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function executeEditFile(
  filePath: string,
  oldText: string,
  newText: string
): Promise<ToolResult> {
  try {
    const safePath = validatePath(filePath);
    const content = await readFile(safePath, 'utf-8');

    if (!content.includes(oldText)) {
      return {
        success: false,
        error: 'oldText not found in file. Make sure the text matches exactly (including whitespace).'
      };
    }

    const newContent = content.replace(oldText, newText);
    await writeFile(safePath, newContent, 'utf-8');

    return {
      success: true,
      data: `Successfully replaced text in ${filePath}`
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function executeListFiles(pattern: string, cwd?: string): Promise<ToolResult> {
  try {
    const searchDir = cwd ? validatePath(cwd) : PROJECT_ROOT;
    const files = await glob(pattern, { cwd: searchDir });

    if (files.length === 0) {
      return { success: true, data: 'No files found matching pattern.' };
    }

    return {
      success: true,
      data: files.slice(0, 100).join('\n') + (files.length > 100 ? `\n\n[Showing 100 of ${files.length} files]` : '')
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function executeSearchCode(
  pattern: string,
  searchPath?: string,
  filePattern?: string
): Promise<ToolResult> {
  try {
    const searchDir = searchPath ? validatePath(searchPath) : PROJECT_ROOT;

    // Build ripgrep command
    let cmd = `rg --line-number --max-count 50 "${pattern.replace(/"/g, '\\"')}"`;

    if (filePattern) {
      cmd += ` -g "${filePattern}"`;
    }

    cmd += ` "${searchDir}"`;

    try {
      const { stdout, stderr } = await execPromise(cmd, {
        cwd: PROJECT_ROOT,
        timeout: 30000,
        maxBuffer: 1024 * 1024 // 1MB
      });

      if (stderr && !stdout) {
        return { success: false, error: stderr };
      }

      return {
        success: true,
        data: stdout || 'No matches found.'
      };
    } catch (execError: unknown) {
      // ripgrep returns exit code 1 when no matches found
      const execErr = execError as { code?: number; message?: string };
      if (execErr.code === 1) {
        return { success: true, data: 'No matches found.' };
      }
      // ripgrep not installed, fall back to grep
      if (execErr.code === 127 || (execErr.message && execErr.message.includes('not found'))) {
        const grepCmd = `grep -rn "${pattern.replace(/"/g, '\\"')}" "${searchDir}" | head -50`;
        const { stdout } = await execPromise(grepCmd, { cwd: PROJECT_ROOT, timeout: 30000 });
        return { success: true, data: stdout || 'No matches found.' };
      }
      throw execError;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function executeRunBash(
  command: string,
  cwd?: string,
  timeout?: number
): Promise<ToolResult> {
  try {
    const workDir = cwd ? validatePath(cwd) : PROJECT_ROOT;
    const timeoutMs = timeout || 30000;

    // Security: Block some dangerous commands
    const dangerous = ['rm -rf /', 'mkfs', 'dd if=', ':(){', 'chmod -R 777 /'];
    const isDangerous = dangerous.some(d => command.includes(d));
    if (isDangerous) {
      return { success: false, error: 'Dangerous command blocked for safety.' };
    }

    const { stdout, stderr } = await execPromise(command, {
      cwd: workDir,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 5 // 5MB
    });

    const output = stdout + (stderr ? `\n[stderr]: ${stderr}` : '');

    return {
      success: true,
      data: output || '(command completed with no output)'
    };
  } catch (error: unknown) {
    // Include stderr in error for debugging
    const err = error as { message?: string; stderr?: string };
    const errOutput = err.stderr ? `\n[stderr]: ${err.stderr}` : '';
    const message = err.message || 'Unknown error';
    return { success: false, error: message + errOutput };
  }
}

// ============================================
// PLAN APPROVAL
// ============================================

export interface PlanProposal {
  title: string;
  summary: string;
  steps: string[];
  filesAffected: string[];
}

export async function executeProposePlan(
  title: string,
  summary: string,
  steps: string[],
  filesAffected: string[]
): Promise<ToolResult> {
  // This doesn't execute anything - it just returns the plan
  // The client will display this with approve/deny buttons
  return {
    success: true,
    data: {
      type: 'PLAN_PROPOSAL',
      needsApproval: true,
      plan: {
        title,
        summary,
        steps,
        filesAffected
      }
    }
  };
}
