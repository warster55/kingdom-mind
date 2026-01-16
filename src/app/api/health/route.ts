import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { appConfig, systemPrompts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSystemPromptHealthStatus } from '@/lib/health/system-prompt-health';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  status: 'ok' | 'error' | 'fallback';
  message?: string;
  source?: string;
  cacheAgeMs?: number | null;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheck;
    systemPrompt: HealthCheck;
    config: HealthCheck;
  };
}

/**
 * GET /api/health
 *
 * System health check endpoint for monitoring.
 * Accessible without authentication.
 *
 * Returns:
 * - healthy: All systems operational
 * - degraded: Some systems using fallbacks but functional
 * - unhealthy: Critical systems (database) are down
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const checks: HealthResponse['checks'] = {
    database: { status: 'error', message: 'Not checked' },
    systemPrompt: { status: 'error', message: 'Not checked' },
    config: { status: 'error', message: 'Not checked' },
  };

  // Check 1: Database connectivity
  try {
    // Simple query to verify database is responsive
    const result = await db
      .select({ id: systemPrompts.id })
      .from(systemPrompts)
      .limit(1);

    checks.database = {
      status: 'ok',
      message: `Connected, ${result.length} system prompt(s) found`,
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Check 2: System prompt status (from chat.ts tracking)
  try {
    const promptHealth = getSystemPromptHealthStatus();

    if (promptHealth.source === 'database') {
      checks.systemPrompt = {
        status: 'ok',
        source: 'database',
        message: 'Loaded from database',
        cacheAgeMs: promptHealth.timestamp ? Date.now() - promptHealth.timestamp : null,
      };
    } else if (promptHealth.source === 'fallback') {
      checks.systemPrompt = {
        status: 'fallback',
        source: 'hardcoded',
        message: promptHealth.error || 'Using fallback system prompt',
        cacheAgeMs: promptHealth.timestamp ? Date.now() - promptHealth.timestamp : null,
      };
    } else {
      // Source is 'unknown' - prompt hasn't been loaded yet
      // Try to load it now to determine status
      const approvedPrompt = await db
        .select({ id: systemPrompts.id })
        .from(systemPrompts)
        .where(eq(systemPrompts.isApproved, true))
        .orderBy(desc(systemPrompts.id))
        .limit(1);

      if (approvedPrompt.length > 0) {
        checks.systemPrompt = {
          status: 'ok',
          source: 'database',
          message: 'Approved prompt available (not yet loaded into cache)',
        };
      } else {
        checks.systemPrompt = {
          status: 'fallback',
          source: 'hardcoded',
          message: 'No approved prompt in database, will use fallback',
        };
      }
    }
  } catch (error) {
    checks.systemPrompt = {
      status: 'fallback',
      source: 'hardcoded',
      message: error instanceof Error ? error.message : 'Error checking system prompt',
    };
  }

  // Check 3: App config table accessibility
  try {
    const configResult = await db
      .select({ key: appConfig.key })
      .from(appConfig)
      .limit(5);

    checks.config = {
      status: 'ok',
      message: `Config table accessible, ${configResult.length} key(s) found`,
    };
  } catch (error) {
    checks.config = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown config error',
    };
  }

  // Determine overall status
  let overallStatus: HealthResponse['status'] = 'healthy';

  // Database error = unhealthy (critical)
  if (checks.database.status === 'error') {
    overallStatus = 'unhealthy';
  }
  // Config error = unhealthy (critical)
  else if (checks.config.status === 'error') {
    overallStatus = 'unhealthy';
  }
  // System prompt fallback = degraded (functional but not optimal)
  else if (checks.systemPrompt.status === 'fallback') {
    overallStatus = 'degraded';
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  };

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
