import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { getFullUrl } from 'src/common/helpers/helper';
import { SubmitChallengeDto } from './dto/submit-challenge.dto';

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: { search?: string; type?: string; page?: number; perPage?: number }) {
    const page = filter?.page && filter.page > 0 ? Number(filter.page) : 1;
    const perPage = filter?.perPage && filter.perPage > 0 ? Number(filter.perPage) : 10;
    const where: any = { status: 'published' };
    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { slug: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter?.type) {
      where.type = filter.type;
    }
    const [total, data] = await Promise.all([
      this.prisma.challenge.count({ where }),
      this.prisma.challenge.findMany({
        where,
        orderBy: { order: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    // Lấy điểm cao nhất cho từng challenge
    const challengeIds = data.map(challenge => challenge.id);
    const maxScores = await this.prisma.challengeScore.groupBy({
      by: ['challenge_id'],
      where: { challenge_id: { in: challengeIds } },
      _max: { score: true },
    });

    // Map điểm cao nhất vào data
    const dataWithMaxScore = data.map(challenge => {
      const maxScoreData = maxScores.find(ms => ms.challenge_id === challenge.id);
      return {
        ...challenge,
        maxScore: maxScoreData?._max.score || 0,
      };
    });

    return {
      data: dataWithMaxScore,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string, userId?: string) {
    const challenge = await this.prisma.challenge.findFirst({
      where: { id, status: 'published' },
      include: {
        questions: { include: { answers: true } },
        puzzleChallenge: true,
        orderingChallenge: { include: { items: true } },
        fillBlankChallenge: { include: { questions: true } },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    let detail: any = { ...challenge };
    if (challenge.type === 'puzzle') {
      const puzzle = challenge.puzzleChallenge
        ? { ...challenge.puzzleChallenge, image: getFullUrl(challenge.puzzleChallenge.image) }
        : null;
      detail = { ...challenge, puzzle };
      delete detail.puzzleChallenge;
    }
    if (challenge.type === 'ordering') {
      detail = { ...challenge, ordering: challenge.orderingChallenge };
      delete detail.orderingChallenge;
    }
    if (challenge.type === 'fillBlank') {
      detail = { ...challenge, fillBlank: challenge.fillBlankChallenge };
      delete detail.fillBlankChallenge;
    }

    let userScore: number | null = null;
    if (userId) {
      const score = await this.prisma.challengeScore.findUnique({
        where: { user_id_challenge_id: { user_id: userId, challenge_id: id } },
      });
      userScore = score?.score ?? null;
    }

    // Lấy điểm cao nhất của challenge này
    const maxScoreData = await this.prisma.challengeScore.aggregate({
      where: { challenge_id: id },
      _max: { score: true },
    });
    const maxScore = maxScoreData._max.score || 0;

    return { ...detail, userScore, maxScore };
  }

  async updateChallengeProgress(userId: string, challengeId: string, score: number) {
    // Kiểm tra challenge có tồn tại không
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    // Upsert điểm và trạng thái làm bài
    return this.prisma.challengeScore.upsert({
      where: { user_id_challenge_id: { user_id: userId, challenge_id: challengeId } },
      update: { score, submitted_at: new Date() },
      create: { user_id: userId, challenge_id: challengeId, score, submitted_at: new Date() },
    });
  }

  async submitChallenge(userId: string, challengeId: string, submitData: SubmitChallengeDto) {
    // Lấy thông tin challenge với tất cả dữ liệu liên quan
    const challenge = await this.prisma.challenge.findFirst({
      where: { id: challengeId, status: 'published' },
      include: {
        questions: { include: { answers: true } },
        puzzleChallenge: true,
        orderingChallenge: { include: { items: true } },
        fillBlankChallenge: { include: { questions: true } },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found or not published');
    }

    let result;
    switch (challenge.type) {
      case 'quiz':
        result = await this.submitQuizChallenge(challenge, submitData.quiz);
        break;
      case 'puzzle':
        result = await this.submitPuzzleChallenge(challenge, submitData.puzzle);
        break;
      case 'ordering':
        result = await this.submitOrderingChallenge(challenge, submitData.ordering);
        break;
      case 'fillBlank':
        result = await this.submitFillBlankChallenge(challenge, submitData.fillBlank);
        break;
      default:
        throw new BadRequestException('Unsupported challenge type');
    }

    // Lưu điểm vào database
    const challengeScore = await this.prisma.challengeScore.upsert({
      where: { user_id_challenge_id: { user_id: userId, challenge_id: challengeId } },
      update: { score: result.score, submitted_at: new Date() },
      create: { user_id: userId, challenge_id: challengeId, score: result.score, submitted_at: new Date() },
    });

    return {
      challengeId,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      submittedAt: challengeScore.submitted_at,
      details: result.details,
    };
  }

  private async submitQuizChallenge(challenge: any, submitData?: any) {
    if (!submitData || !submitData.answers) {
      throw new BadRequestException('Quiz answers are required');
    }

    const questions = challenge.questions;
    const userAnswers = submitData.answers;
    let correctAnswers = 0;
    const details: any[] = [];

    for (const userAnswer of userAnswers) {
      const question = questions.find(q => q.id === userAnswer.questionId);
      if (!question) continue;

      const selectedAnswer = question.answers.find(a => a.id === userAnswer.answerId);
      const isCorrect = selectedAnswer?.is_correct || false;
      
      if (isCorrect) correctAnswers++;

      details.push({
        questionId: userAnswer.questionId,
        selectedAnswerId: userAnswer.answerId,
        isCorrect,
        correctAnswerId: question.answers.find(a => a.is_correct)?.id
      });
    }

    const score = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

    return {
      score,
      totalQuestions: questions.length,
      correctAnswers,
      details
    };
  }

  private async submitPuzzleChallenge(challenge: any, submitData?: any) {
    if (!submitData || typeof submitData.score !== 'number') {
      throw new BadRequestException('Score is required for puzzle challenge');
    }

    const score = Math.max(0, Math.min(100, submitData.score));

    return {
      score,
      totalQuestions: 1,
      correctAnswers: score > 0 ? 1 : 0,
      details: {
        score
      }
    };
  }

  private async submitOrderingChallenge(challenge: any, submitData?: any) {
    if (!submitData || !submitData.items) {
      throw new BadRequestException('Ordering items are required');
    }

    const orderingChallenge = challenge.orderingChallenge;
    if (!orderingChallenge || !orderingChallenge.items) {
      throw new BadRequestException('Ordering challenge data not found');
    }

    const correctItems = orderingChallenge.items;
    const userItems = submitData.items;
    let correctAnswers = 0;
    const details: any[] = [];

    for (const userItem of userItems) {
      const correctItem = correctItems.find(item => item.id === userItem.itemId);
      if (!correctItem) continue;

      const isCorrect = correctItem.correct_order === userItem.position;
      if (isCorrect) correctAnswers++;

      details.push({
        itemId: userItem.itemId,
        userPosition: userItem.position,
        correctPosition: correctItem.correct_order,
        isCorrect
      });
    }

    const score = correctItems.length > 0 ? (correctAnswers / correctItems.length) * 100 : 0;

    return {
      score,
      totalQuestions: correctItems.length,
      correctAnswers,
      details
    };
  }

  private async submitFillBlankChallenge(challenge: any, submitData?: any) {
    if (!submitData || !submitData.answers) {
      throw new BadRequestException('Fill blank answers are required');
    }

    const fillBlankChallenge = challenge.fillBlankChallenge;
    if (!fillBlankChallenge || !fillBlankChallenge.questions) {
      throw new BadRequestException('Fill blank challenge data not found');
    }

    const questions = fillBlankChallenge.questions;
    const userAnswers = submitData.answers;
    let correctAnswers = 0;
    const details: any[] = [];

    for (const userAnswer of userAnswers) {
      const question = questions.find(q => q.id === userAnswer.questionId);
      if (!question) continue;

      // So sánh không phân biệt hoa thường và bỏ khoảng trắng thừa
      const isCorrect = question.correct_word.toLowerCase().trim() === 
                       userAnswer.answer.toLowerCase().trim();
      
      if (isCorrect) correctAnswers++;

      details.push({
        questionId: userAnswer.questionId,
        userAnswer: userAnswer.answer,
        correctAnswer: question.correct_word,
        isCorrect
      });
    }

    const score = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

    return {
      score,
      totalQuestions: questions.length,
      correctAnswers,
      details
    };
  }
}
