import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { ChallengeStatus, ChallengeType } from './dto/create-challenge.dto';

@Injectable()
export class AdminChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: { search?: string; status?: string; type?: string; page?: number; perPage?: number }) {
    const page = filter?.page && filter.page > 0 ? Number(filter.page) : 1;
    const perPage = filter?.perPage && filter.perPage > 0 ? Number(filter.perPage) : 10;
    const where: any = {};
    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { slug: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.type) {
      where.type = filter.type;
    }
    const [total, data] = await Promise.all([
      this.prisma.challenge.count({ where }),
      this.prisma.challenge.findMany({
        where,
        orderBy: { order: 'asc' },
        include: {
          questions: {
            include: { answers: true },
          },
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);
    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        questions: {
          include: { answers: true },
        },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async create(dto: CreateChallengeDto) {
    // 1. Tạo challenge chính
    const challenge = await this.prisma.challenge.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        type: dto.type as ChallengeType.quiz,
        order: dto.order ?? 0,
        status: (dto.status ?? 'draft') as ChallengeStatus,
      },
    });

    if (dto.type === 'quiz') {
      if (!dto.questions || dto.questions.length === 0) {
        throw new BadRequestException('Quiz type requires at least one question');
      }
      // 1. Tạo questions và answers
      await Promise.all(
        dto.questions.map(async (q) => {
          const question = await this.prisma.challengeQuestion.create({
            data: {
              challenge_id: challenge.id,
              question: q.question,
              explanation: q.explanation ?? null,
            },
          });
          if (q.answers && q.answers.length > 0) {
            await this.prisma.challengeAnswer.createMany({
              data: q.answers.map((a) => ({
                challenge_question_id: question.id,
                answer: a.answer,
                is_correct: a.is_correct,
              })),
            });
          }
        }),
      );
    }

    // 2. Tạo bảng con theo type
    if (dto.type === 'puzzle') {
      if (!dto.puzzle) throw new BadRequestException('Missing puzzle data');
      console.log('Creating puzzle challenge', dto.puzzle);
      await this.prisma.puzzleChallenge.create({
        data: {
          challenge_id: challenge.id,
          instruction: dto.puzzle.instruction,
          image: dto.puzzle.image,
        },
      });
    }
    if (dto.type === 'ordering') {
      if (!dto.ordering) throw new BadRequestException('Missing ordering data');
      const ordering = await this.prisma.orderingChallenge.create({
        data: {
          challenge_id: challenge.id,
          instruction: dto.ordering.instruction,
        },
      });
      if (dto.ordering.items?.length) {
        await this.prisma.orderingItem.createMany({
          data: dto.ordering.items.map((item) => ({
            ordering_id: ordering.id,
            content: item.content,
            correct_order: item.correct_order,
          })),
        });
      }
    }
    if (dto.type === 'fillBlank') {
      if (!dto.fillBlank) throw new BadRequestException('Missing fillBlank data');
      const fillBlank = await this.prisma.fillBlankChallenge.create({
        data: {
          challenge_id: challenge.id,
        },
      });
      if (dto.fillBlank.questions?.length) {
        await this.prisma.fillBlankQuestion.createMany({
          data: dto.fillBlank.questions.map((q) => ({
            challenge_id: fillBlank.id,
            sentence: q.sentence,
            correct_word: q.correct_word,
          })),
        });
      }
    }

    return challenge;
  }

  async update(id: string, dto: CreateChallengeDto) {
    // Xóa toàn bộ question/answer cũ (nếu có)
    const oldQuestions = await this.prisma.challengeQuestion.findMany({ where: { challenge_id: id } });
    for (const q of oldQuestions) {
      await this.prisma.challengeAnswer.deleteMany({ where: { challenge_question_id: q.id } });
    }
    await this.prisma.challengeQuestion.deleteMany({ where: { challenge_id: id } });

    // Xóa bảng con cũ
    await this.prisma.puzzleChallenge.deleteMany({ where: { challenge_id: id } });
    const oldOrdering = await this.prisma.orderingChallenge.findFirst({ where: { challenge_id: id } });
    if (oldOrdering) {
      await this.prisma.orderingItem.deleteMany({ where: { ordering_id: oldOrdering.id } });
      await this.prisma.orderingChallenge.delete({ where: { id: oldOrdering.id } });
    }
    const oldFillBlank = await this.prisma.fillBlankChallenge.findFirst({ where: { challenge_id: id } });
    if (oldFillBlank) {
      await this.prisma.fillBlankQuestion.deleteMany({ where: { challenge_id: oldFillBlank.id } });
      await this.prisma.fillBlankChallenge.delete({ where: { id: oldFillBlank.id } });
    }

    // Cập nhật challenge chính
    const challenge = await this.prisma.challenge.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        type: dto.type as ChallengeType.quiz,
        order: dto.order ?? 0,
        status: (dto.status ?? 'draft') as ChallengeStatus,
      },
    });

    // Tạo lại dữ liệu bảng con theo type mới
    if (dto.type === 'quiz') {
      if (!dto.questions || dto.questions.length === 0) {
        throw new BadRequestException('Quiz type requires at least one question');
      }
      await Promise.all(
        dto.questions.map(async (q) => {
          const question = await this.prisma.challengeQuestion.create({
            data: {
              challenge_id: challenge.id,
              question: q.question,
              explanation: q.explanation ?? null,
            },
          });
          if (q.answers && q.answers.length > 0) {
            await this.prisma.challengeAnswer.createMany({
              data: q.answers.map((a) => ({
                challenge_question_id: question.id,
                answer: a.answer,
                is_correct: a.is_correct,
              })),
            });
          }
        }),
      );
    }
    if (dto.type === 'puzzle') {
      if (!dto.puzzle) throw new BadRequestException('Missing puzzle data');
      await this.prisma.puzzleChallenge.create({
        data: {
          challenge_id: challenge.id,
          instruction: dto.puzzle.instruction,
          image: dto.puzzle.image,
        },
      });
    }
    if (dto.type === 'ordering') {
      if (!dto.ordering) throw new BadRequestException('Missing ordering data');
      const ordering = await this.prisma.orderingChallenge.create({
        data: {
          challenge_id: challenge.id,
          instruction: dto.ordering.instruction,
        },
      });
      if (dto.ordering.items?.length) {
        await this.prisma.orderingItem.createMany({
          data: dto.ordering.items.map((item) => ({
            ordering_id: ordering.id,
            content: item.content,
            correct_order: item.correct_order,
          })),
        });
      }
    }
    if (dto.type === 'fillBlank') {
      if (!dto.fillBlank) throw new BadRequestException('Missing fillBlank data');
      const fillBlank = await this.prisma.fillBlankChallenge.create({
        data: {
          challenge_id: challenge.id,
        },
      });
      if (dto.fillBlank.questions?.length) {
        await this.prisma.fillBlankQuestion.createMany({
          data: dto.fillBlank.questions.map((q) => ({
            challenge_id: fillBlank.id,
            sentence: q.sentence,
            correct_word: q.correct_word,
          })),
        });
      }
    }

    return challenge;
  }

  async remove(id: string) {
    // Xóa toàn bộ question/answer liên quan
    const oldQuestions = await this.prisma.challengeQuestion.findMany({ where: { challenge_id: id } });
    for (const q of oldQuestions) {
      await this.prisma.challengeAnswer.deleteMany({ where: { challenge_question_id: q.id } });
    }
    await this.prisma.challengeQuestion.deleteMany({ where: { challenge_id: id } });
    // Xóa challenge
    await this.prisma.challenge.delete({ where: { id } });
    return { success: true };
  }
}
