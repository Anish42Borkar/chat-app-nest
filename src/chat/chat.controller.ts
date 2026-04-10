import { Controller, Get, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import type { AuthRequest } from 'src/common/types/auth-request.type';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatRepository: ChatRepository,
  ) {}

  @Get('conversationsList')
  async conversations(@Req() req: AuthRequest) {
    const id = req.user.userId;

    return this.chatRepository.getConversations(id);
  }

  @Get('messages')
  async getMessages(
    @Query('conversationId') conversationId: number,
    @Query('parsedCursor') parsedCursor?: string,
  ) {
    const data = await this.chatService.getMessages(
      conversationId,
      parsedCursor,
    );

    console.log(data);
    return data;
  }
}
