import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, ValidateNested, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ChallengeType, ChallengeStatus } from './create-challenge.dto';

class UpdateChallengeAnswerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  is_correct?: boolean;
}

class UpdateChallengeQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ type: [UpdateChallengeAnswerDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateChallengeAnswerDto)
  answers?: UpdateChallengeAnswerDto[];
}

class UpdatePuzzleChallengeDto {
  @ApiPropertyOptional()
  @IsOptional()
  instruction?: string;
  
  @ApiPropertyOptional({ description: 'Image URL hoặc base64 string (data:image/jpeg;base64,...)', example: 'https://example.com/image.jpg hoặc data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' })
  @IsOptional()
  image?: string;
}

class UpdateOrderingItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  content?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  correct_order?: number;
}

class UpdateOrderingChallengeDto {
  @ApiPropertyOptional()
  @IsOptional()
  instruction?: string;
  
  @ApiPropertyOptional({ type: [UpdateOrderingItemDto] })
  @IsOptional()
  items?: UpdateOrderingItemDto[];
}

class UpdateFillBlankQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  sentence?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  correct_word?: string;
}

class UpdateFillBlankChallengeDto {
  @ApiPropertyOptional({ type: [UpdateFillBlankQuestionDto] })
  @IsOptional()
  questions?: UpdateFillBlankQuestionDto[];
}

export class UpdateChallengeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ChallengeType })
  @IsEnum(ChallengeType)
  @IsOptional()
  type?: ChallengeType;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ enum: ChallengeStatus })
  @IsEnum(ChallengeStatus)
  @IsOptional()
  status?: ChallengeStatus;

  @ApiPropertyOptional({ type: [UpdateChallengeQuestionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateChallengeQuestionDto)
  questions?: UpdateChallengeQuestionDto[];

  @ApiPropertyOptional({ type: UpdatePuzzleChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePuzzleChallengeDto)
  puzzle?: UpdatePuzzleChallengeDto;

  @ApiPropertyOptional({ type: UpdateOrderingChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderingChallengeDto)
  ordering?: UpdateOrderingChallengeDto;

  @ApiPropertyOptional({ type: UpdateFillBlankChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateFillBlankChallengeDto)
  fillBlank?: UpdateFillBlankChallengeDto;
}
