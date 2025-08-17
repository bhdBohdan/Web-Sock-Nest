import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Socket } from 'socket.io';

export class JwtGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient<Socket>();

    return { headers: { authorization: client.handshake.auth?.token } }; //like http, as passport expects
  }

  //handleRequest is called after the strategy (JWT) validates the token.
  handleRequest(
    err: any,
    user: User,
    info: any,
    context: ExecutionContext,
    status?: any,
  ) {
    const client = context.switchToWs().getClient<Socket>();
    if (user) {
      // Attach user payload to socket for future handlers
      const { password, ...safeUser } = user;
      client.data.user = safeUser;
      return user;
    }
    return super.handleRequest(err, user, info, context); //call default handleRequest so error will be handled
  }
}
//client.handshake.auth or client.handshake.headers.
//const socket = io('ws://localhost:3000', { auth: { token: 'JWT_HERE' } });
