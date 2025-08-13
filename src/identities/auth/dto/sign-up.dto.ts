import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength, IsOptional } from 'class-validator';
import { Grade } from 'generated/prisma';

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
  @IsNotEmpty() 
  @ApiProperty()
  fullName: string;

  @IsNumber()
  @IsNumber()
  @IsOptional()
  @ApiProperty()
  age?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ enum: Grade, enumName: 'grade' })
  grade?: Grade;
}
