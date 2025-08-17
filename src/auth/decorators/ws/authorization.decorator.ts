import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../guards/auth.guard';

export function AuthorizationWS() {
  return applyDecorators(UseGuards(JwtGuard));
}
