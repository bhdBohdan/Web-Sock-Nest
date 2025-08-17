import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterRequest {
  @ApiProperty({
    description: 'Full Name of person',
    example: 'Jane Doe',
    maxLength: 50,
  })
  @IsString({ message: 'Name is not string' })
  @IsNotEmpty({ message: 'Name is empty' })
  @MaxLength(50, { message: "Name can't have more than 50 char" })
  name: string;

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
  @IsString({ message: 'password is noSt string' })
  @IsNotEmpty({ message: 'password is empty' })
  @MinLength(6, { message: 'password is too short (<6)' })
  @MaxLength(128, { message: 'password is too big (>128)' })
  password: string;
}
