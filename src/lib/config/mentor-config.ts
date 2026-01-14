/**
 * Kingdom Mind - Mentor Configuration (Database-Driven)
 *
 * All AI memory and behavior settings are stored in app_config table.
 * This allows runtime tuning via Architect mode without code changes.
 */

import { db, appConfig } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Type-safe config keys with their expected types and defaults
export const MENTOR_CONFIG = {
  // Memory Depth
  chat_history_limit: { default: 15, description: 'Number of messages from current session to include' },
  cross_session_history_limit: { default: 10, description: 'Number of messages from previous sessions to include' },
  memory_window_days: { default: 30, description: 'How far back (in days) to pull cross-session history' },
  insight_depth: { default: 5, description: 'Number of recent insights/breakthroughs to remember' },

  // Context Richness
  include_resonance_scores: { default: true, description: 'Whether to show 7-domain resonance scores to AI' },
  include_completed_curriculum: { default: true, description: 'Whether to show completed curriculum items' },
  completed_curriculum_limit: { default: 5, description: 'Number of completed truths to show' },

  // Behavior
  onboarding_enabled: { default: false, description: 'Whether to use formal Genesis onboarding protocol' },
  first_session_greeting: { default: 'Welcome, Seeker. I am here to walk with you on your journey of transformation. What brings you to the Sanctuary today?', description: 'Greeting for brand new users' },

  // AI Model Settings
  reasoning_for_breakthroughs: { default: true, description: 'Use reasoning model for breakthrough moments' },
} as const;

export type MentorConfigKey = keyof typeof MENTOR_CONFIG;

/**
 * Get a single config value with type-safe default
 */
export async function getConfig<K extends MentorConfigKey>(
  key: K
): Promise<typeof MENTOR_CONFIG[K]['default']> {
  try {
    const dbKey = `mentor_${key}`;
    const result = await db.select().from(appConfig).where(eq(appConfig.key, dbKey)).limit(1);

    if (result[0]?.value !== undefined) {
      return result[0].value as typeof MENTOR_CONFIG[K]['default'];
    }
  } catch (e) {
    console.warn(`[Config] Error fetching ${key}:`, e);
  }

  return MENTOR_CONFIG[key].default;
}

/**
 * Get all mentor config values at once (more efficient for chat flow)
 */
export async function getAllMentorConfig(): Promise<{
  [K in MentorConfigKey]: typeof MENTOR_CONFIG[K]['default']
}> {
  const defaults = Object.fromEntries(
    Object.entries(MENTOR_CONFIG).map(([k, v]) => [k, v.default])
  ) as { [K in MentorConfigKey]: typeof MENTOR_CONFIG[K]['default'] };

  try {
    const results = await db.select().from(appConfig);

    for (const row of results) {
      const key = row.key.replace('mentor_', '') as MentorConfigKey;
      if (key in MENTOR_CONFIG && row.value !== undefined) {
        (defaults as any)[key] = row.value;
      }
    }
  } catch (e) {
    console.warn('[Config] Error fetching all config:', e);
  }

  return defaults;
}

/**
 * Set a config value (for Architect mode)
 */
export async function setConfig<K extends MentorConfigKey>(
  key: K,
  value: typeof MENTOR_CONFIG[K]['default']
): Promise<void> {
  const dbKey = `mentor_${key}`;
  const description = MENTOR_CONFIG[key].description;

  await db.insert(appConfig)
    .values({ key: dbKey, value: value as any, description, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: { value: value as any, updatedAt: new Date() }
    });
}

/**
 * Get all config keys with their current values and descriptions (for Architect display)
 */
export async function getConfigManifest(): Promise<Array<{
  key: string;
  value: any;
  default: any;
  description: string;
}>> {
  const current = await getAllMentorConfig();

  return Object.entries(MENTOR_CONFIG).map(([key, meta]) => ({
    key,
    value: current[key as MentorConfigKey],
    default: meta.default,
    description: meta.description,
  }));
}
