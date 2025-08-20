import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtGuardWS } from 'src/auth/guards/auth.guardWS';

export function AuthorizationWS() {
  return applyDecorators(UseGuards(JwtGuardWS));
}
