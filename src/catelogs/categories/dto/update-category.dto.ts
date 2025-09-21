import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Tên danh mục (1–150 ký tự)', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn thân thiện (URL)', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional({ description: 'Mô tả ngắn cho danh mục' })
  @IsOptional()
  @IsString()
  short_description?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'], description: 'Trạng thái' })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';
}
