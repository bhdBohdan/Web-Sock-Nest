import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    description: 'Email of person',
    example: 'JaneDoe@gmail.com',
  })
  @IsString({ message: 'email is not string' })
  @IsNotEmpty({ message: 'email is empty' })
  @IsEmail({}, { message: 'Invalid name of email' })
  email: string;

  @ApiProperty({
    description: 'Account Password of person',
    example: 'JonhDOe2008',
    minLength: 6,
    maxLength: 128,
  })
  @IsString({ message: 'password is not string' })
  @IsNotEmpty({ message: 'password is empty' })
  @MinLength(6, { message: 'password is too short (<6)' })
  @MaxLength(128, { message: 'password is too big (>128)' })
  password: string;
}
