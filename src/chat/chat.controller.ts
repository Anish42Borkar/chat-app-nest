import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // @Post('user')
  // async createUser(@Body() body: { name: string; email: string }) {
  //   return this.chatService.createUser(body.name, body.email);
  // }
}
