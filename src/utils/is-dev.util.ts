import { ConfigService } from '@nestjs/config';

export const IsDev = (configService: ConfigService) =>
  configService.getOrThrow('NODE_ENV') === 'development';
