// db/schema/conversationParticipants.ts

import { pgTable, serial, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { conversations } from './conversations';

export const conversationParticipants = pgTable('conversation_participants', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});
