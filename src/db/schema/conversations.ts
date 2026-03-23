import { pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

export const conversations = pgTable('conversations', {
  id: serial().primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
