import { pgTable, text, timestamp, jsonb, varchar, serial, integer, boolean } from 'drizzle-orm/pg-core';

// --- APP CONFIGURATION (UI Settings) ---
export const appConfig = pgTable('app_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- SYSTEM PROMPTS (Database-Driven AI Instructions) ---
// The active system prompt is used for the mentor AI.
// Edit via database to update AI behavior without code deploy.
export const systemPrompts = pgTable('system_prompts', {
  id: serial('id').primaryKey(),
  version: integer('version').notNull().default(1),
  content: text('content').notNull(),
  changeLog: text('change_log'),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- CURRICULUM (21-Step Spiritual Formation Journey) ---
// 7 domains × 3 pillars each = 21 steps
// Domains: identity, purpose, mindset, relationships, vision, action, legacy
export const curriculum = pgTable('curriculum', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 50 }).notNull(),
  pillarName: varchar('pillar_name', { length: 100 }).notNull(),
  pillarOrder: integer('pillar_order').notNull(),
  description: text('description').notNull(),
  keyTruth: text('key_truth').notNull(),
  coreVerse: text('core_verse'),
});
