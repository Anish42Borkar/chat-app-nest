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

    // 1. Save message
    const message = await this.chatService.sendMessage(
      senderId,
      receiverId,
      content,
    );

    // 2. Emit message (existing)
    this.server.to(`user_${senderId}`).emit('receive_message', message);
    this.server.to(`user_${receiverId}`).emit('receive_message', message);

    // 🔥 3. Fetch updated conversations
    const senderConversations =
      await this.chatService.getConversations(senderId);

    const receiverConversations =
      await this.chatService.getConversations(receiverId);

    // 🔥 4. Emit updated chat list
    this.server
      .to(`user_${senderId}`)
      .emit('conversation_list', senderConversations);

    this.server
      .to(`user_${receiverId}`)
      .emit('conversation_list', receiverConversations);

    return message;
  }
}
