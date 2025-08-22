import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtGuardWS } from 'src/auth/guards/auth.guardWS';
import { WsRolesGuard } from 'src/auth/guards/role.guardWS';

// export const WsRoles = createParamDecorator(
//   (roles: string[], ctx: ExecutionContext) => {
//     const client: Socket = ctx.switchToWs().getClient();
//     const user = client.data.user;

//     if (!user) {
//       throw new WsException('User not authenticated');
//     }

//     if (!roles.includes(user.role)) {
//       throw new WsException('Invalid permissions');
//     }

//     return user;
//   },
// );

export function WsRoleGuard(...roles: string[]) {
  return applyDecorators(UseGuards(JwtGuardWS, new WsRolesGuard(roles)));
}
