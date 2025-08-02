import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// DTO cho submit quiz challenge
export class SubmitQuizAnswerDto {
  @ApiProperty({ description: 'ID của câu hỏi' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'ID của câu trả lời được chọn' })
  @IsString()
  answerId: string;
}

export class SubmitQuizChallengeDto {
  @ApiProperty({ type: [SubmitQuizAnswerDto], description: 'Danh sách câu trả lời' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitQuizAnswerDto)
  answers: SubmitQuizAnswerDto[];
}

// DTO cho submit puzzle challenge
export class PuzzleSubmitDto {
  @ApiProperty({
    description: 'Điểm số của puzzle (0-100)',
    example: 85
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;
}

// DTO cho submit ordering challenge
export class SubmitOrderingItemDto {
  @ApiProperty({ description: 'ID của item' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Vị trí được sắp xếp (bắt đầu từ 1)' })
  @IsInt()
  position: number;
}

export class SubmitOrderingChallengeDto {
  @ApiProperty({ type: [SubmitOrderingItemDto], description: 'Thứ tự sắp xếp của các item' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitOrderingItemDto)
  items: SubmitOrderingItemDto[];
}

// DTO cho submit fill blank challenge
export class SubmitFillBlankAnswerDto {
  @ApiProperty({ description: 'ID của câu hỏi fill blank' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Từ được điền vào chỗ trống' })
  @IsString()
  answer: string;
}

export class SubmitFillBlankChallengeDto {
  @ApiProperty({ type: [SubmitFillBlankAnswerDto], description: 'Danh sách câu trả lời fill blank' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitFillBlankAnswerDto)
  answers: SubmitFillBlankAnswerDto[];
}

// DTO chung cho submit challenge
export class SubmitChallengeDto {
  @ApiPropertyOptional({ type: SubmitQuizChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubmitQuizChallengeDto)
  quiz?: SubmitQuizChallengeDto;

  @ApiPropertyOptional({ type: PuzzleSubmitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PuzzleSubmitDto)
  puzzle?: PuzzleSubmitDto;

  @ApiPropertyOptional({ type: SubmitOrderingChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubmitOrderingChallengeDto)
  ordering?: SubmitOrderingChallengeDto;

  @ApiPropertyOptional({ type: SubmitFillBlankChallengeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubmitFillBlankChallengeDto)
  fillBlank?: SubmitFillBlankChallengeDto;
}
