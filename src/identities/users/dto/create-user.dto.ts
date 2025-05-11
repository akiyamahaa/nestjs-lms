import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Jayson S. Alcala',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(96)
  fullName: string;

  @ApiProperty({
    example: 'jayson.alcala@gmail.com',
    description: 'Email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(96)
  email: string;

  @ApiProperty({
    example: '12345678',
    description: 'Password of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(96)
  password: string;
}
