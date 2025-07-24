import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, ValidateNested, IsArray, IsInt } from 'class-validator';
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
  @ApiProperty() instruction: string;
  @ApiProperty() image: string;
}
class OrderingItemDto {
  @ApiProperty() content: string;
  @ApiProperty() correct_order: number;
}
class OrderingChallengeDto {
  @ApiProperty() instruction: string;
  @ApiProperty({ type: [OrderingItemDto] }) items: OrderingItemDto[];
}
class FillBlankQuestionDto {
  @ApiProperty() sentence: string;
  @ApiProperty() correct_word: string;
}
class FillBlankChallengeDto {
  @ApiProperty({ type: [FillBlankQuestionDto] }) questions: FillBlankQuestionDto[];
}

export class CreateChallengeDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  slug: string;

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
