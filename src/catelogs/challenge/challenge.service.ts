import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { getFullUrl } from 'src/common/helpers/helper';

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

    return { ...detail, userScore };
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
}
