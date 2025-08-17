import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';
import { Socket } from 'socket.io';

export const AuthorizedWS = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const client: Socket = ctx.switchToWs().getClient<Socket>();

    const user = client.data.user;

    return data ? user![data] : user;
  },
);
