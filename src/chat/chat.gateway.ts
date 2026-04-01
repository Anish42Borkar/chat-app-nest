import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';
import { ChatRepository } from './chat.repository';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private chatRepository: ChatRepository,
  ) {}

  // using middleware, it will validate token before shaking hand
  afterInit(server: Server) {
    server.use((socket, next) => {
      try {
        // get token from client
        const token = socket.handshake.auth?.token;

        if (!token) {
          console.log('inside middleware test ', token);

          return next(new UnauthorizedException('Unauthorized'));
        }

        // varifying token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

        socket.data.user = decoded;

        console.log(decoded);

        next(); // ✅ allow connection
      } catch (err) {
        console.log('inside middleware error');

        console.log(err);

        next(new UnauthorizedException('Unauthorized')); // ❌ reject BEFORE connection
      }
    });
  }

  handleConnection(client: Socket) {
    try {
      const data = client.data;
      // join room
      client.join(`user_${data.user.userId}`);
    } catch (err) {
      client.disconnect();
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const { senderId, receiverId, content } = data;

    console.log('socker message data ', data);

    // 1. Save message
    const message = await this.chatService.sendMessage(
      senderId,
      receiverId,
      content,
    );

    console.log('server emit message ', message, ' ', `user_${senderId}`);
    // 2. Emit message (existing)
    this.server.to(`user_${senderId}`).emit('receive_message', message);
    this.server.to(`user_${receiverId}`).emit('receive_message', message);

    // 🔥 3. Fetch updated conversations
    const senderConversations =
      await this.chatRepository.getConversations(senderId);

    const receiverConversations =
      await this.chatRepository.getConversations(receiverId);

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
