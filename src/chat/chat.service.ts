import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { db } from 'src/db';

@Injectable()
export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async sendMessage(senderId: number, receiverId: number, content: string) {
    return await db.transaction(async (tx) => {
      // 1. find existing conversation
      let conversationId = await this.chatRepository.findConversation(
        senderId,
        receiverId,
        tx,
      );

      // 2. if not exists → create
      if (!conversationId) {
        const conversation = await this.chatRepository.createConversation(tx);
        conversationId = conversation.id;

        await this.chatRepository.addParticipants(
          conversationId,
          senderId,
          receiverId,
          tx,
        );
      }

      // 3. insert message
      const message = await this.chatRepository.createMessage(
        conversationId,
        senderId,
        content,
        tx,
      );

      // 4. update conversation
      await this.chatRepository.updateConversation(conversationId, tx);
      return message;
    });
  }

  async getMessages(conversationId: number, parsedCursor?: string) {
    const result = await this.chatRepository.getMessages(
      conversationId,
      parsedCursor,
    );
    return result.rows;
  }
}
