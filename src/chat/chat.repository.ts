import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { PgTransaction, PgDatabase } from 'drizzle-orm/pg-core';

import { db } from 'src/db';
import { conversationParticipants } from 'src/db/schema/conversationParticipants';
import { conversations } from 'src/db/schema/conversations';
import { messages } from 'src/db/schema/messages';

type DBOrTx = PgDatabase<any, any, any> | PgTransaction<any, any, any>;

@Injectable()
export class ChatRepository {
  // chat.repository.ts (or service for now)
  async findConversation(
    senderId: number,
    receiverId: number,
    tx: DBOrTx = db,
  ) {
    const result = await tx.execute(sql`
        SELECT cp.conversation_id
        FROM conversation_participants cp
        WHERE cp.user_id IN (${senderId}, ${receiverId})
        GROUP BY cp.conversation_id
        HAVING COUNT(DISTINCT cp.user_id) = 2
        LIMIT 1
      `);

    return result.rows[0]?.conversation_id as number | undefined;
  }

  async createConversation(tx: DBOrTx = db) {
    const [conversation] = await tx
      .insert(conversations)
      .values({})
      .returning();

    return conversation;
  }

  async addParticipants(
    conversationId: number,
    userA: number,
    userB: number,
    tx: DBOrTx = db,
  ) {
    await tx.insert(conversationParticipants).values([
      { conversationId, userId: userA },
      { conversationId, userId: userB },
    ]);
  }

  async createMessage(
    conversationId: number,
    senderId: number,
    content: string,
    tx: DBOrTx = db,
  ) {
    const [message] = await tx
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
      })
      .returning();

    return message;
  }

  async updateConversation(conversationId: number, tx: DBOrTx = db) {
    await tx
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  async getConversations(userId: number, tx: DBOrTx = db) {
    const result = await tx.execute(sql`
    SELECT *
    FROM (
      SELECT DISTINCT ON (c.id)
        c.id AS "conversationId",
        c.updated_at AS "updatedAt" ,

        u.id AS "otherUserId",
        u.name AS "otherUserName",

        m.content AS "lastMessage",
        m.created_at AS "lastMessageTime"

      FROM conversations c

      JOIN conversation_participants cp 
        ON cp.conversation_id = c.id

      JOIN conversation_participants cp2 
        ON cp2.conversation_id = c.id
        AND cp2.user_id != ${userId}

      JOIN users u 
        ON u.id = cp2.user_id

      LEFT JOIN messages m 
        ON m.conversation_id = c.id

      WHERE cp.user_id = ${userId}

      ORDER BY c.id, m.created_at DESC
    ) sub

    ORDER BY "updatedAt" DESC
  `);

    return result.rows;
  }

  async getMessages(conversationId: number, cursor?: string, limit = 20) {
    console.log(cursor, '  cursor');
    // const cursorDate = cursor ? new Date(cursor) : undefined;
    if (cursor) {
      return await db.execute(`
          SELECT  id,
                  conversation_id AS "conversationId",
                  sender_id AS "senderId",
                  content,
                  created_at AS "createdAt"
          FROM messages 
            WHERE conversation_Id = ${conversationId} 
            AND created_at < '${cursor}'
            ORDER BY created_at desc
            LIMIT ${limit}
          `);
    }

    return await db.execute(`
          SELECT  id,
                  conversation_id AS "conversationId",
                  sender_id AS "senderId",
                  content,
                  created_at AS "createdAt"
          FROM messages 
            WHERE conversation_Id = ${conversationId} 
            ORDER BY created_at desc
            LIMIT ${limit}
          `);
  }

  async getUser(user: string, userId: number) {
    const userData = (
      await db.execute(`SELECT id FROM users WHERE email = '${user}'`)
    ).rows;

    const receiverId = userData[0].id as number;

    const conversation = await this.findConversation(userId, receiverId);

    return conversation;
  }
}
