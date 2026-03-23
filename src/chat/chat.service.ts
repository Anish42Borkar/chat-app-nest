import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { db } from 'src/db';
import { conversationParticipants } from 'src/db/schema/conversationParticipants';
import { conversations } from 'src/db/schema/conversations';
import { messages } from 'src/db/schema/messages';

@Injectable()
export class ChatService {
  // chat.repository.ts (or service for now)

  async findConversation(userA: number, userB: number) {
    const result = await db.execute(sql`
    SELECT cp.conversation_id
    FROM conversation_participants cp
    WHERE cp.user_id IN (${userA}, ${userB})
    GROUP BY cp.conversation_id
    HAVING COUNT(DISTINCT cp.user_id) = 2
    LIMIT 1
  `);

    return result.rows[0]?.conversation_id as number | undefined;
  }

  async createConversation() {
    const [conversation] = await db
      .insert(conversations)
      .values({})
      .returning();

    return conversation;
  }

  async addParticipants(
    conversationId: number,
    senderId: number,
    reciverId: number,
  ) {
    await db.insert(conversationParticipants).values([
      { conversationId, userId: senderId },
      { conversationId, userId: reciverId },
    ]);
  }

  async createMessage(
    conversationId: number,
    senderId: number,
    content: string,
  ) {
    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
      })
      .returning();

    return message;
  }

  async updateConversation(conversationId: number) {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  async sendMessage(userA: number, userB: number, content: string) {
    // 1. find existing conversation
    let conversationId = await this.findConversation(userA, userB);

    // 2. if not exists → create
    if (!conversationId) {
      const conversation = await this.createConversation();
      conversationId = conversation.id;

      await this.addParticipants(conversationId, userA, userB);
    }

    // 3. insert message
    const message = await this.createMessage(conversationId, userA, content);

    // 4. update conversation
    await this.updateConversation(conversationId);

    return message;
  }
}
