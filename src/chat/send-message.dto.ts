import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  roomName: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
