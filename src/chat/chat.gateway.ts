import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from './send-message.dto';
import { AuthorizationWS } from 'src/auth/decorators/ws/authorization.decorator';
import { User } from '@prisma/client';
import { Logger, NotFoundException, ValidationPipe } from '@nestjs/common';
import { UserWS } from 'src/auth/decorators/ws/authorizedWS.decorator';
import { WsRoleGuard } from 'src/auth/decorators/ws/roleWS.decorator';

@WebSocketGateway(3001, {
  cors: {
    origin: '*', // Adjust for production
  },
}) //Contoller //Resolver
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.debug(
      `Handshake auth: ${JSON.stringify(client.handshake.auth)}`,
    );
    this.logger.debug(
      `Handshake headers: ${JSON.stringify(client.handshake.headers)}`,
    );
    this.logger.debug(
      `Client rooms: ${JSON.stringify(Array.from(client.rooms))}`,
    );
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected ', client.id);
  }

  // @WsRoleGuard('MODERATOR')
  // @SubscribeMessage('test')
  // test(@UserWS() user: User) {
  //     this.logger.log(user);
  // }

  @AuthorizationWS()
  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody(new ValidationPipe({ transform: true })) dto: SendMessageDto,
    @UserWS() user: User,
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
    @UserWS() user: User,
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
      console.log(err);
    }
  }

  @AuthorizationWS()
  @SubscribeMessage('room:leave')
  async handleLeaveServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
    @UserWS() user: User,
  ) {
    client.leave(room);
    console.log('client leaved room');
    const text = `User ${user.name} has left the chat`;

    const message = await this.chatService.addMessage(room, null, text); //system msg

    client.broadcast.to(room).emit('message:new', message);
  }

  @WsRoleGuard('MODERATOR', 'ADMIN')
  @SubscribeMessage('room:create')
  async handleCreateServer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    { room, type }: { room: string; type: 'DM' | 'PRIVATE' | 'PUBLIC' },

    //@UserWS() user: User,
  ) {
    this.logger.debug(`Handshake auth: ${room},  ${type}`);
    try {
      if (await this.chatService.findRoom(room)) {
        throw new NotFoundException('Room already exists');
      }

      await this.chatService.createRoom(room, type);

      const chats = this.chatService.retrieveRooms('PUBLIC');

      client.emit('room:list', chats);
    } catch (err) {
      console.log(err);
    }
  }

  @WsRoleGuard('MODERATOR', 'ADMIN') //acts like @authWs() anyway
  @SubscribeMessage('room:delete')
  async handleDeleteServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
    @UserWS() user: User,
  ) {
    try {
      if (!(await this.chatService.findRoom(room))) {
        throw new NotFoundException('Room not found');
      }

      await this.chatService.deleteRoom(room);

      const chats = this.chatService.retrieveRooms('PUBLIC');

      client.emit('room:list', chats);
    } catch (err) {
      console.log(err);
    }
  }
}
