import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewStatusDto {
  @ApiProperty({ 
    description: 'Review status (true: approved, false: rejected)',
    example: true
  })
  @IsBoolean()
  status: boolean;

  @ApiPropertyOptional({ 
    description: 'Admin note about the status change',
    example: 'Review approved - content is appropriate'
  })
  @IsOptional()
  @IsString()
  admin_note?: string;
}
