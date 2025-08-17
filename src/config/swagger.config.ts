import { DocumentBuilder } from '@nestjs/swagger';

export function getSwaggerConfig() {
  return (
    new DocumentBuilder()
      .setTitle('WEBSOCKET  project')
      .setDescription('Api docs')
      .setVersion('1.0.0')
      // .setContact('MyName', 'https://myUrl.com', 'myEmail@gmail.com')
      .addBearerAuth()
      .build()
  );
}
