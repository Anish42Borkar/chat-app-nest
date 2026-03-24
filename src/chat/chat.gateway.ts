import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;

    if (userId) {
      client.join(`user_${userId}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const { senderId, receiverId, content } = data;

    const message = await this.chatService.sendMessage(
      senderId,
      receiverId,
      content,
    );

    // send only to sender & receiver
    this.server.to(`user_${senderId}`).emit('receive_message', message);
    this.server.to(`user_${receiverId}`).emit('receive_message', message);

    return message;
  }
}
