import { pgTable, serial, text, boolean, timestamp, integer, jsonb, index, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- SACRED PILLARS (The Immutable Truths) ---
export const sacredPillars = pgTable('sacred_pillars', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  order: integer('order').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- APP CONFIGURATION (The Fluid Sanctuary) ---
export const appConfig = pgTable('app_config', {
  key: varchar('key', { length: 100 }).primaryKey(), 
  value: jsonb('value').notNull(), 
  description: text('description'), 
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Users ---
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').notNull().default('user'),
  isApproved: boolean('is_approved').default(false).notNull(),
  currentDomain: text('current_domain').default('Identity').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  
  // --- Sanctuary Resonance ---
  resonanceIdentity: integer('resonance_identity').default(0).notNull(),
  resonancePurpose: integer('resonance_purpose').default(0).notNull(),
  resonanceMindset: integer('resonance_mindset').default(0).notNull(),
  resonanceRelationships: integer('resonance_relationships').default(0).notNull(),
  resonanceVision: integer('resonance_vision').default(0).notNull(),
  resonanceAction: integer('resonance_action').default(0).notNull(),
  resonanceLegacy: integer('resonance_legacy').default(0).notNull(),

  // --- GENESIS STATE ---
  onboardingStage: integer('onboarding_stage').default(0).notNull(),
  hasCompletedOnboarding: boolean('has_completed_onboarding').default(false).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// --- Curriculum (The Bones) ---
export const curriculum = pgTable('curriculum', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 50 }).notNull(),
  pillarName: varchar('pillar_name', { length: 100 }).notNull(),
  pillarOrder: integer('pillar_order').notNull(),
  description: text('description').notNull(),
  keyTruth: text('key_truth').notNull(),
  coreVerse: text('core_verse'),
});

// --- User Progress (The Journey) ---
export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  curriculumId: integer('curriculum_id').references(() => curriculum.id).notNull(),
  status: varchar('status', { length: 20 }).default('locked').notNull(),
  level: integer('level').default(1).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_progress_user_id_idx').on(table.userId),
}));

// --- Habits ---
export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  domain: varchar('domain', { length: 50 }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 20 }).default('daily'),
  streak: integer('streak').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastCompletedAt: timestamp('last_completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Insights (The Gold) ---
export const insights = pgTable('insights', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: integer('session_id').references(() => mentoringSessions.id, { onDelete: 'set null' }),
  domain: varchar('domain', { length: 50 }).notNull(),
  content: text('content').notNull(),
  importance: integer('importance').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- THOUGHTS (The Raw Stream) ---
export const thoughts = pgTable('thoughts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isProcessed: boolean('is_processed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Verification Codes ---
export const verificationCodes = pgTable('verification_codes', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Mentoring Sessions ---
export const mentoringSessions = pgTable('mentoring_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionNumber: integer('session_number').notNull(),
  topic: varchar('topic', { length: 255 }),
  status: varchar('status', { length: 20 }).default('active'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
});

// --- Chat Messages (The Omniscient Record) ---
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => mentoringSessions.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  
  // TELEMETRY SUITE
  telemetry: jsonb('telemetry'),
  sentiment: jsonb('sentiment'),
  costMetadata: jsonb('cost_metadata'),
  
  xPos: integer('x_pos'),
  yPos: integer('y_pos'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Client Events (Frontend Logs) ---
export const clientEvents = pgTable('client_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).notNull(), 
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- System Prompts ---
export const systemPrompts = pgTable('system_prompts', {
  id: serial('id').primaryKey(),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  changeLog: text('change_log'),
  isActive: boolean('is_approved').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Greetings ---
export const greetings = pgTable('greetings', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), 
  content: text('content').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  curriculum: one(curriculum, { fields: [userProgress.curriculumId], references: [curriculum.id] }),
}));