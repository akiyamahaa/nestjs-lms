import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitQuizAnswerDto {
  @ApiProperty({ type: String })
  @IsString()
  questionId: string;

  @ApiProperty({ type: String })
  @IsString()
  answerId: string;
}

export class SubmitQuizDto {
  @ApiProperty({ type: [SubmitQuizAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitQuizAnswerDto)
  answers: SubmitQuizAnswerDto[];
}
