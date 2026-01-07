import { pgTable, serial, text, boolean, timestamp, integer, jsonb, index, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Users ---
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').notNull().default('user'),
  isApproved: boolean('is_approved').default(false).notNull(),
  currentDomain: text('current_domain').default('Identity').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  hasCompletedOnboarding: boolean('has_completed_onboarding').default(false).notNull(),
  onboardingStep: integer('onboarding_step').default(0).notNull(),
  onboardingData: jsonb('onboarding_data'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// --- Habits (Action Anchors) ---
export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  domain: varchar('domain', { length: 50 }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 20 }).default('daily'), // daily, weekly
  streak: integer('streak').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastCompletedAt: timestamp('last_completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('habits_user_id_idx').on(table.userId),
}));

// --- Insights (The Constellation) ---
export const insights = pgTable('insights', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: integer('session_id').references(() => mentoringSessions.id, { onDelete: 'set null' }),
  domain: varchar('domain', { length: 50 }).notNull(),
  content: text('content').notNull(),
  importance: integer('importance').default(1).notNull(), // For visual scaling in the map
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('insights_user_id_idx').on(table.userId),
}));

// --- System Prompts & More ---
// (Keeping existing tables: mentoringSessions, chatMessages, domains, systemPrompts, verificationCodes)
// ... [rest of existing schema]

export const verificationCodes = pgTable('verification_codes', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('verification_codes_email_idx').on(table.email),
}));

export const mentoringSessions = pgTable('mentoring_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionNumber: integer('session_number').notNull(),
  topic: varchar('topic', { length: 255 }),
  status: varchar('status', { length: 20 }).default('active'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  summary: text('summary'),
}, (table) => ({
  userIdIdx: index('mentoring_sessions_user_id_idx').on(table.userId),
}));

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => mentoringSessions.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('chat_messages_session_id_idx').on(table.sessionId),
}));

export const domains = pgTable('domains', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  orderIndex: integer('order_index').notNull(),
  coreQuestion: text('core_question').notNull(),
  overview: text('overview').notNull(),
});

export const systemPrompts = pgTable('system_prompts', {
  id: serial('id').primaryKey(),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  changeLog: text('change_log'),
  isActive: boolean('is_approved').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(mentoringSessions),
  insights: many(insights),
  habits: many(habits),
}));

export const mentoringSessionsRelations = relations(mentoringSessions, ({ many, one }) => ({
  user: one(users, { fields: [mentoringSessions.userId], references: [users.id] }),
  messages: many(chatMessages),
  insights: many(insights),
}));

export const habitsRelations = relations(habits, ({ one }) => ({
  user: one(users, { fields: [habits.userId], references: [users.id] }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  user: one(users, { fields: [insights.userId], references: [users.id] }),
  session: one(mentoringSessions, { fields: [insights.sessionId], references: [mentoringSessions.id] }),
}));