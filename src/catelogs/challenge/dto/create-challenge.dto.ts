import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, ValidateNested, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export enum ChallengeType {
  quiz = 'quiz',
  assignment = 'assignment',
  exam = 'exam',
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

  @ApiProperty({ type: [CreateChallengeQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChallengeQuestionDto)
  questions: CreateChallengeQuestionDto[];
}
