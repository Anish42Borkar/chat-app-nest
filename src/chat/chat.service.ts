import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';

@Injectable()
export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async sendMessage(userA: number, userB: number, content: string) {
    // 1. find existing conversation
    let conversationId = await this.chatRepository.findConversation(
      userA,
      userB,
    );

    // 2. if not exists → create
    if (!conversationId) {
      const conversation = await this.chatRepository.createConversation();
      conversationId = conversation.id;

      await this.chatRepository.addParticipants(conversationId, userA, userB);
    }

    // 3. insert message
    const message = await this.chatRepository.createMessage(
      conversationId,
      userA,
      content,
    );

    // 4. update conversation
    await this.chatRepository.updateConversation(conversationId);

    return message;
  }
}
