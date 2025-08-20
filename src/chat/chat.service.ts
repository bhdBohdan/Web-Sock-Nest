import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from './send-message.dto';
import { User } from '@prisma/client';
import { NotFoundError } from 'rxjs';

const socketToUser = new Map<string, string>();

// map roomName -> roomId
const roomNameToId = new Map<string, string>();

// optional: userId -> socket.id[]
const userToSockets = new Map<string, string[]>();

type RoomType = 'DM' | 'PRIVATE' | 'PUBLIC';

@Injectable()
export class ChatService {
  constructor(private readonly prismaService: PrismaService) {}

  async addMessage(roomName: string, user: User | null, text: string) {
    const room = await this.prismaService.room.findUnique({
      where: {
        roomName,
      },
    });
    const roomId = room?.id;
    const userId = user?.id;

    if (!roomId) {
      throw new NotFoundException('room not found');
    }

    try {
      const message = await this.prismaService.message.create({
        data: {
          text,
          roomId,
          userId,
          isSystem: !user,
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
              role: true,
            },
          },
          room: {
            select: {
              roomName: true,
              type: true,
            },
          },
        },
      });

      return message;
    } catch (err) {
      throw new BadRequestException('Failed to create message', err.message);
    }
  }

  async removeMessage(id: string) {
    await this.prismaService.message.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Message not found');
    });

    return true;
  }

  async retrieveMessage(roomName: string) {
    const room = await this.prismaService.room.findUnique({
      where: {
        roomName,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room.messages;
  }

  async retrieveRooms(type: RoomType) {
    const rooms = await this.prismaService.room.findMany({
      take: 10,
      where: { type },
    });

    return rooms;
  }

  async createRoom(roomName: string, type: RoomType) {
    return await this.prismaService.room.create({
      data: {
        roomName,
        type,
      },
      select: {
        id: true,
        roomName: true,
        type: true,
      },
    });
  }

  async findRoom(roomName: string) {
    return await this.prismaService.room.findUnique({
      where: {
        roomName,
      },
    });
  }

  async deleteRoom(roomName: string) {
    await this.prismaService.room
      .delete({
        where: {
          roomName,
        },
      })
      .catch(() => {
        throw new NotFoundException('Room not found');
      });

    return true;
  }
}
