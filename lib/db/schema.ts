import { pgTable, serial, text, boolean, timestamp, integer, jsonb, index, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Users ---
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').notNull().default('user'), // 'user', 'admin'
  isApproved: boolean('is_approved').default(false).notNull(), // The Sanctuary Lock
  currentDomain: text('current_domain').default('Identity').notNull(), // Tracking 7 domains
  hasCompletedOnboarding: boolean('has_completed_onboarding').default(false).notNull(),
  onboardingStep: integer('onboarding_step').default(0).notNull(),
  onboardingData: jsonb('onboarding_data'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// --- Verification Codes (OTP) ---
export const verificationCodes = pgTable('verification_codes', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('verification_codes_email_idx').on(table.email),
}));

// --- Mentoring Sessions ---
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

// --- Chat Messages ---
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => mentoringSessions.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('chat_messages_session_id_idx').on(table.sessionId),
}));

// --- Domains (The 7 Pillars) ---
export const domains = pgTable('domains', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  orderIndex: integer('order_index').notNull(),
  coreQuestion: text('core_question').notNull(),
  overview: text('overview').notNull(),
});

// --- Insights (Session Breakthroughs) ---

export const insights = pgTable('insights', {

  id: serial('id').primaryKey(),

  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  sessionId: integer('session_id').references(() => mentoringSessions.id, { onDelete: 'set null' }),

  domain: varchar('domain', { length: 50 }).notNull(),

  content: text('content').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),

}, (table) => ({

  userIdIdx: index('insights_user_id_idx').on(table.userId),

}));



// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({

  sessions: many(mentoringSessions),

  insights: many(insights),

}));



export const mentoringSessionsRelations = relations(mentoringSessions, ({ many, one }) => ({

  user: one(users, { fields: [mentoringSessions.userId], references: [users.id] }),

  messages: many(chatMessages),

  insights: many(insights),

}));



export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({

  session: one(mentoringSessions, { fields: [chatMessages.sessionId], references: [mentoringSessions.id] }),

}));



export const insightsRelations = relations(insights, ({ one }) => ({

  user: one(users, { fields: [insights.userId], references: [users.id] }),

  session: one(mentoringSessions, { fields: [insights.sessionId], references: [mentoringSessions.id] }),

}));



// --- Types ---

export type User = typeof users.$inferSelect;

export type VerificationCode = typeof verificationCodes.$inferSelect;

export type MentoringSession = typeof mentoringSessions.$inferSelect;

export type ChatMessage = typeof chatMessages.$inferSelect;

export type Domain = typeof domains.$inferSelect;

export type Insight = typeof insights.$inferSelect;
