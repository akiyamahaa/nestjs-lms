import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class refreshTokenDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  refreshToken: string;
}
