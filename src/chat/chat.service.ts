import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from './send-message.dto';

const socketToUser = new Map<string, string>();

// map roomName -> roomId
const roomNameToId = new Map<string, string>();

// optional: userId -> socket.id[]
const userToSockets = new Map<string, string[]>();

@Injectable()
export class ChatService {
  constructor(private readonly prismaService: PrismaService) {}

  private rooms: Record<string, object[]> = {};

  async onConnection() {}

  async sendMessage(dto: SendMessageDto) {
    const { text, roomName } = dto;

    // const message = await this.prismaService.message.create({
    //   data: {
    //     text
    //   },
    // });

    // return message;
  }

  addMessage(room: string, user: string | null, text: string) {
    if (!this.rooms[room]) this.rooms[room] = [];
    this.rooms[room].push({
      room,
      user,
      text,
      isSystem: !user,
    });
    return this.rooms[room];
  }

  async retrieveMessage(room: string) {
    if (!this.rooms[room]) {
      this.rooms[room] = [];
      return [];
    }
    return this.rooms[room];
  }
}
