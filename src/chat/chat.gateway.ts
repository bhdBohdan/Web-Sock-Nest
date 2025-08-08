import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from './send-message.dto';

@WebSocketGateway(3001, {}) //Contoller //Resolver
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log('client connected ', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected ', client.id);
  }

  @SubscribeMessage('send')
  async handleMessage(@MessageBody() dto: SendMessageDto) {
    const message = await this.chatService.sendMessage(dto);

    this.server.emit('messages', message);

    return message;
  }
}
