import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatRepository],
})
export class ChatModule {}
