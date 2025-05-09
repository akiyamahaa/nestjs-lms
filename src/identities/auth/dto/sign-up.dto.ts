import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from 'src/common/validators/match.validator';

export class SignUpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'User password (min 8 characters)',
    minLength: 8,
  })
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Password confirmation (must match password)',
    minLength: 8,
  })
  @MinLength(8)
  @Match('password', { message: 'Passwords do not match' })
  passwordConfirmation: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    minLength: 3,
    maxLength: 96,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(96)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    minLength: 3,
    maxLength: 96,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(96)
  lastName: string;
}
