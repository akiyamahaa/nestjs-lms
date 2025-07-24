import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findFirst({
      where: { id, status: 'published' },
      include: {
        questions: {
          include: { answers: true },
        },
        puzzleChallenge: true,
        orderingChallenge: {
          include: { items: true },
        },
        fillBlankChallenge: {
          include: { questions: true },
        },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    let detail: any = { ...challenge };
    if (challenge.type === 'puzzle') {
      detail = { ...challenge, puzzle: challenge.puzzleChallenge };
      delete detail.puzzleChallenge;
    }
    if (challenge.type === 'erdering') {
      detail = { ...challenge, ordering: challenge.orderingChallenge };
      delete detail.orderingChallenge;
    }
    if (challenge.type === 'fillBlank') {
      detail = { ...challenge, fillBlank: challenge.fillBlankChallenge };
      delete detail.fillBlankChallenge;
    }

    return detail;
  }
}
