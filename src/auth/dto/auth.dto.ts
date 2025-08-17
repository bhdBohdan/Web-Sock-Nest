import { ApiProperty } from '@nestjs/swagger';

export class AuthResponse {
  @ApiProperty({
    description: 'JWT accesss token',
    example: 'dsjgjuauhIGDYGuGdgdadIKG...',
  })
  accessToken: string;
}
