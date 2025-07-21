import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.challenge.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        type: dto.type,
        order: dto.order ?? 0,
        status: dto.status ?? ChallengeStatus.draft,
        questions: {
          create: dto.questions.map((q) => ({
            question: q.question,
            explanation: q.explanation,
            answers: {
              create: q.answers.map((a) => ({
                answer: a.answer,
                is_correct: a.is_correct,
              })),
            },
          })),
        },
      },
      include: {
        questions: { include: { answers: true } },
      },
    });
  }

  async update(id: string, dto: CreateChallengeDto) {
    // Xóa toàn bộ question/answer cũ
    const oldQuestions = await this.prisma.challengeQuestion.findMany({ where: { challenge_id: id } });
    for (const q of oldQuestions) {
      await this.prisma.challengeAnswer.deleteMany({ where: { challenge_question_id: q.id } });
    }
    await this.prisma.challengeQuestion.deleteMany({ where: { challenge_id: id } });
    // Cập nhật challenge và tạo lại questions/answers
    return this.prisma.challenge.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        type: dto.type,
        order: dto.order ?? 0,
        status: dto.status ?? 'draft',
        questions: {
          create: dto.questions.map((q) => ({
            question: q.question,
            explanation: q.explanation,
            answers: {
              create: q.answers.map((a) => ({
                answer: a.answer,
                is_correct: a.is_correct,
              })),
            },
          })),
        },
      },
      include: {
        questions: { include: { answers: true } },
      },
    });
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
