import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Tên danh mục (1–150 ký tự)', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiProperty({ description: 'Đường dẫn thân thiện (URL)', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  slug: string;

  @ApiProperty({ description: 'Mô tả ngắn cho danh mục' })
  @IsString()
  short_description: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'], default: 'draft', description: 'Trạng thái' })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';
}