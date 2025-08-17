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

const users = new Map<string, object[]>();

@WebSocketGateway(3001, {}) //Contoller //Resolver
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    //everyone but me
    console.log('client connected ', client.id);

    // client.broadcast.emit('user-joined', {
    //   message: `new user joined ${client.id}`,
    // });

    // this.server.emit() everyone
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

  @SubscribeMessage('remove')
  async removeMessage(@MessageBody() dto: SendMessageDto) {}

  @SubscribeMessage('joinRoom')
  async handleJoinServer(@MessageBody() room: string, client: Socket) {
    client.join(room);

    const messages = this.chatService.retrieveMessage(room);
    const message = `User ${client.handshake.query?.username} has entered the chat`;

    client.broadcast.to(room).emit('message', message);

    this.chatService.addMessage(room, null, message);

    client.emit('message:get', messages);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveServer(@MessageBody() room: string, client: Socket) {
    client.leave(room);
    this.server
      .to(room)
      .emit(
        'message',
        `User ${client.handshake.query?.username} has left the chat`,
      );
  }
}
