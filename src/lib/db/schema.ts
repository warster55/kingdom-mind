import { pgTable, text, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core';

// --- APP CONFIGURATION (UI Settings) ---
// This is the ONLY table actively used by the Sanctuary Architecture.
// All other tables are legacy from the previous user-account-based system.
export const appConfig = pgTable('app_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NOTE: Legacy tables (users, chat_messages, insights, etc.) still exist
// in the database but are no longer used. The Sanctuary Architecture
// stores all user data in a client-side encrypted blob in IndexedDB.
// See ROADMAP.md for details on the architecture change.
