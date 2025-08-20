import {
  ConnectedSocket,
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
import { AuthorizationWS } from 'src/auth/decorators/ws/authorization.decorator';
import { AuthorizedWS } from 'src/auth/decorators/ws/authorizedWS.decorator';
import { User } from '@prisma/client';
import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { NotFoundError } from 'rxjs';

@WebSocketGateway(3001, {}) //Contoller //Resolver
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log('client connected', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected ', client.id);
  }

  @AuthorizationWS()
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody(new ValidationPipe({ transform: true })) dto: SendMessageDto,
    @AuthorizedWS() user: User,
  ) {
    const { roomName, text } = dto;
    const message = await this.chatService.addMessage(roomName, user, text);

    this.server.to(roomName).emit('message:new', message);

    console.log(
      'Room ',
      message.room.roomName,
      ': User: ',
      message.user?.name,
      ': ',
      message.text,
    );
  }

  @SubscribeMessage('remove')
  async removeMessage(
    @MessageBody() messageId: string,
    @MessageBody() roomName: string,
  ) {
    await this.chatService.removeMessage(messageId);

    this.server.to(roomName).emit('message:removed', { id: messageId });
  }

  @AuthorizationWS()
  @SubscribeMessage('room:join')
  async handleJoinServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
    @AuthorizedWS() user: User,
  ) {
    try {
      if (!(await this.chatService.findRoom(room))) {
        throw new NotFoundException('Room not found');
      }

      client.join(room);

      console.log('client joined room');

      const text = `User ${user.name} has entered the chat`;

      const message = await this.chatService.addMessage(room, null, text); //system msg

      client.broadcast.to(room).emit('message:new', message);

      const messages = await this.chatService.retrieveMessage(room);

      client.emit('message:get', messages);
    } catch (err) {
      return err;
    }
  }

  @SubscribeMessage('room:leave')
  async handleLeaveServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
    @AuthorizedWS() user: User,
  ) {
    client.leave(room);
    console.log('client leaved room');
    const text = `User ${user.name} has left the chat`;

    const message = await this.chatService.addMessage(room, null, text); //system msg

    client.broadcast.to(room).emit('message:new', message);
  }

  @SubscribeMessage('room:create')
  async handleCreateServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
    @MessageBody() type: 'DM' | 'PRIVATE' | 'PUBLIC',
    @AuthorizedWS() user: User,
  ) {
    try {
      if (await this.chatService.findRoom(room)) {
        throw new NotFoundException('Room already exists');
      }

      await this.chatService.createRoom(room, type);

      const chats = this.chatService.retrieveRooms('PUBLIC');

      client.emit('room:list', chats);
    } catch {}
  }

  @SubscribeMessage('room:delete')
  async handleDeleteServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
    @AuthorizedWS() user: User,
  ) {
    try {
      if (!(await this.chatService.findRoom(room))) {
        throw new NotFoundException('Room not found');
      }

      await this.chatService.deleteRoom(room);

      const chats = this.chatService.retrieveRooms('PUBLIC');

      client.emit('room:list', chats);
    } catch {}
  }
}
