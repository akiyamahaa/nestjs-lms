import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, ValidateNested, IsArray, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum ChallengeType {
  quiz = 'quiz',
  puzzle = 'puzzle',
  ordering = 'ordering',
  fillBlank = 'fillBlank',
}

export enum ChallengeStatus {
  draft = 'draft',
  published = 'published',
  archived = 'archived',
}

class CreateChallengeAnswerDto {
  @ApiProperty()
  @IsString()
  answer: string;

  @ApiProperty()
  @IsBoolean()
  is_correct: boolean;
}

class CreateChallengeQuestionDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ type: [CreateChallengeAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChallengeAnswerDto)
  answers: CreateChallengeAnswerDto[];
}

class PuzzleChallengeDto {
  @ApiProperty()
  @IsString()
  instruction: string;
  
  @ApiProperty({ description: 'Image URL hoặc base64 string (data:image/jpeg;base64,...)', example: 'https://example.com/image.jpg hoặc data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' })
  @IsString()
  image: string;
}

class OrderingItemDto {
  @ApiProperty()
  @IsString()
  content: string;
  
  @ApiProperty()
  @IsInt()
  correct_order: number;
}

class OrderingChallengeDto {
  @ApiProperty()
  @IsString()
  instruction: string;
  
  @ApiProperty({ type: [OrderingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderingItemDto)
  items: OrderingItemDto[];
}

class FillBlankQuestionDto {
  @ApiProperty()
  @IsString()
  sentence: string;
  
  @ApiProperty()
  @IsString()
  correct_word: string;
}

class FillBlankChallengeDto {
  @ApiProperty({ type: [FillBlankQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FillBlankQuestionDto)
  questions: FillBlankQuestionDto[];
}

export class CreateChallengeDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'URL slug - tự động tạo từ title nếu không có' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ChallengeType })
  @IsEnum(ChallengeType)
  type: ChallengeType;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ enum: ChallengeStatus, default: ChallengeStatus.draft })
  @IsEnum(ChallengeStatus)
  @IsOptional()
  status?: ChallengeStatus;

  @ApiPropertyOptional({ type: [CreateChallengeQuestionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateChallengeQuestionDto)
  questions?: CreateChallengeQuestionDto[];

  @ApiPropertyOptional({ type: PuzzleChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PuzzleChallengeDto)
  puzzle?: PuzzleChallengeDto;

  @ApiPropertyOptional({ type: OrderingChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderingChallengeDto)
  ordering?: OrderingChallengeDto;

  @ApiPropertyOptional({ type: FillBlankChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FillBlankChallengeDto)
  fillBlank?: FillBlankChallengeDto;
}
