import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Nội dung tin nhắn gửi đi' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'ID conversation (null nếu tạo mới)' })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
