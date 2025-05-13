import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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

  @IsString()
  @IsNotEmpty() // Make fullName required
  @ApiProperty()
  fullName: string; // Remove the "?" to make it required
}
