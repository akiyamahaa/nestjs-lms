import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Grade } from 'generated/prisma';

export class EditUserDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  fullName?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  age?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ enum: Grade, enumName: 'grade' })
  grade?: Grade;
}
