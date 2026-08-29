import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RenameConversationDto {
  @ApiProperty({ description: 'Tên mới của conversation' })
  @IsString()
  title: string;
}
