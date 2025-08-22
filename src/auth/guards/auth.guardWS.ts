import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtGuardWS implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);

    console.log('Guard invoked, token:', token);

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('JWT_SECRET'), // Use your JWT secret
      });

      const { password, ...safeUser } = await this.authService.validate(
        payload.id,
      );

      client.data.user = safeUser;

      return true;
    } catch (error) {
      console.log(error);
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const auth = client.handshake.auth;
    if (auth && auth.token) {
      return auth.token;
    }
    return null;
  }
}
//client.handshake.auth or client.handshake.headers.
//const socket = io('ws://localhost:3000', { auth: { token: 'JWT_HERE' } });
