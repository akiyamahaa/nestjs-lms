import { ApiProperty } from '@nestjs/swagger';

export class SubmitChallengeResponseDto {
  @ApiProperty({ description: 'ID của challenge' })
  challengeId: string;

  @ApiProperty({ description: 'Điểm số (0-100)', example: 85 })
  score: number;

  @ApiProperty({ description: 'Tổng số câu hỏi/mục', example: 5 })
  totalQuestions: number;

  @ApiProperty({ description: 'Số câu trả lời đúng', example: 4 })
  correctAnswers: number;

  @ApiProperty({ description: 'Thời gian submit', type: Date })
  submittedAt: Date;

  @ApiProperty({ 
    description: 'Chi tiết kết quả từng câu/mục',
    example: {
      quiz: [
        {
          questionId: 'uuid',
          selectedAnswerId: 'uuid',
          isCorrect: true,
          correctAnswerId: 'uuid'
        }
      ],
      puzzle: {
        completionTime: 120,
        moveCount: 45
      },
      ordering: [
        {
          itemId: 'uuid',
          userPosition: 1,
          correctPosition: 1,
          isCorrect: true
        }
      ],
      fillBlank: [
        {
          questionId: 'uuid',
          userAnswer: 'correct word',
          correctAnswer: 'correct word',
          isCorrect: true
        }
      ]
    }
  })
  details: any;
}
