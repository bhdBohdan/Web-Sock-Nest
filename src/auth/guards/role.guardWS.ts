import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsRolesGuard implements CanActivate {
  constructor(private readonly requiredRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const user = client.data.user;

    if (!user) {
      console.log('Nuh uh');
      throw new WsException('User not authenticated');
    }

    if (!this.requiredRoles.includes(user.role)) {
      console.log('Nuh uh');

      throw new WsException('Insufficient permissions');
    }

    return true;
  }
}
