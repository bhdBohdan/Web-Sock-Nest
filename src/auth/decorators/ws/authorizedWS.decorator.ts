import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { User } from '@prisma/client';
import { Request } from 'express';
import { Socket } from 'socket.io';

export const UserWS = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const client: Socket = ctx.switchToWs().getClient<Socket>();

    const user = client.data.user;
    if (!user) {
      throw new WsException('User not authenticated');
    }

    return data ? user![data] : user;
  },
);
