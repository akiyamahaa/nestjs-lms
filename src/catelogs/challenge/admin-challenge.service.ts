import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeStatus, ChallengeType } from './dto/create-challenge.dto';
import { UserScoresQueryDto } from './dto/user-scores-query.dto';

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
          // Quiz questions và answers (chỉ đếm số lượng để tối ưu performance)
          questions: {
            select: {
              id: true,
              question: true,
              _count: {
                select: {
                  answers: true
                }
              }
            },
            take: 1 // Chỉ lấy 1 question đầu tiên để preview
          },
          // Puzzle challenge data
          puzzleChallenge: {
            select: {
              instruction: true,
              image: true
            }
          },
          // Ordering challenge data
          orderingChallenge: {
            select: {
              instruction: true,
              _count: {
                select: {
                  items: true
                }
              }
            }
          },
          // Fill blank challenge data
          fillBlankChallenge: {
            select: {
              _count: {
                select: {
                  questions: true
                }
              }
            }
          },
          // Thống kê số lượng user đã làm
          _count: {
            select: {
              challengeScore: true
            }
          }
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);
    return {
      data: data.map(challenge => ({
        ...challenge,
        // Thêm summary info cho từng challenge
        summary: this.getChallengesSummary(challenge),
        stats: {
          totalCompletions: challenge._count.challengeScore
        }
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  private getChallengesSummary(challenge: any) {
    switch (challenge.type) {
      case 'quiz':
        return {
          questionsCount: challenge.questions.length,
          hasQuestions: challenge.questions.length > 0,
          preview: challenge.questions[0]?.question || null
        };
        
      case 'puzzle':
        return {
          hasData: !!challenge.puzzleChallenge,
          preview: challenge.puzzleChallenge?.instruction || null
        };
        
      case 'ordering':
        return {
          itemsCount: challenge.orderingChallenge?._count.items || 0,
          hasData: !!challenge.orderingChallenge,
          preview: challenge.orderingChallenge?.instruction || null
        };
        
      case 'fillBlank':
        return {
          questionsCount: challenge.fillBlankChallenge?._count.questions || 0,
          hasData: !!challenge.fillBlankChallenge,
          preview: null
        };
        
      default:
        return { hasData: false, preview: null };
    }
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        // Quiz questions và answers
        questions: {
          include: { 
            answers: {
              orderBy: { id: 'asc' }
            }
          },
          orderBy: { id: 'asc' }
        },
        // Puzzle challenge data
        puzzleChallenge: true,
        // Ordering challenge data với items
        orderingChallenge: {
          include: {
            items: {
              orderBy: { correct_order: 'asc' }
            }
          }
        },
        // Fill blank challenge data với questions
        fillBlankChallenge: {
          include: {
            questions: {
              orderBy: { id: 'asc' }
            }
          }
        },
        // Thống kê số lượng user đã làm
        _count: {
          select: {
            challengeScore: true
          }
        }
      },
    });
    
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Format lại data để dễ sử dụng ở frontend
    const formattedChallenge = {
      ...challenge,
      // Chuyển đổi data theo type để dễ dàng sử dụng
      data: this.formatChallengeData(challenge),
      // Thống kê
      stats: {
        totalCompletions: challenge._count.challengeScore
      }
    };

    return formattedChallenge;
  }

  private formatChallengeData(challenge: any) {
    switch (challenge.type) {
      case 'quiz':
        return {
          questions: challenge.questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            explanation: q.explanation,
            answers: q.answers.map((a: any) => ({
              id: a.id,
              answer: a.answer,
              is_correct: a.is_correct
            }))
          }))
        };
        
      case 'puzzle':
        return challenge.puzzleChallenge ? {
          instruction: challenge.puzzleChallenge.instruction,
          image: challenge.puzzleChallenge.image
        } : null;
        
      case 'ordering':
        return challenge.orderingChallenge ? {
          instruction: challenge.orderingChallenge.instruction,
          items: challenge.orderingChallenge.items.map((item: any) => ({
            id: item.id,
            content: item.content,
            correct_order: item.correct_order,
            explanation: item.explanation
          }))
        } : null;
        
      case 'fillBlank':
        return challenge.fillBlankChallenge ? {
          questions: challenge.fillBlankChallenge.questions.map((q: any) => ({
            id: q.id,
            sentence: q.sentence,
            correct_word: q.correct_word
          }))
        } : null;
        
      default:
        return null;
    }
  }

  async create(dto: CreateChallengeDto) {
    // Tự động tạo slug nếu không có và đảm bảo unique
    const slug = await this.ensureUniqueSlug(dto.slug || this.generateSlug(dto.title));

    // 1. Tạo challenge chính
    const challenge = await this.prisma.challenge.create({
      data: {
        title: dto.title,
        slug,
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
      if (!dto.puzzle.instruction) throw new BadRequestException('Puzzle instruction is required');
      if (!dto.puzzle.image) throw new BadRequestException('Puzzle image is required');
      
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
      if (!dto.ordering.instruction) throw new BadRequestException('Ordering instruction is required');
      
      const ordering = await this.prisma.orderingChallenge.create({
        data: {
          challenge_id: challenge.id,
          instruction: dto.ordering.instruction,
        },
      });
      if (dto.ordering.items?.length) {
        // Validate ordering items
        const orderNumbers = dto.ordering.items.map(item => item.correct_order);
        const uniqueOrders = new Set(orderNumbers);
        if (uniqueOrders.size !== orderNumbers.length) {
          throw new BadRequestException('Ordering items must have unique correct_order values');
        }
        
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

  async update(id: string, dto: UpdateChallengeDto) {
    // Kiểm tra challenge có tồn tại không
    const existingChallenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!existingChallenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Chỉ xóa và tạo lại khi type thay đổi hoặc có dữ liệu mới
    const isTypeChanged = dto.type && dto.type !== existingChallenge.type;
    
    if (isTypeChanged || dto.questions || dto.puzzle || dto.ordering || dto.fillBlank) {
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
    }

    // Chuẩn bị data để update challenge chính
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.slug !== undefined) {
      // Kiểm tra và đảm bảo slug unique nếu có thay đổi
      let newSlug = dto.slug || this.generateSlug(dto.title || existingChallenge.title);
      if (newSlug !== existingChallenge.slug) {
        newSlug = await this.ensureUniqueSlug(newSlug, id);
      }
      updateData.slug = newSlug;
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.order !== undefined) updateData.order = dto.order;
    if (dto.status !== undefined) updateData.status = dto.status;

    // Cập nhật challenge chính
    const challenge = await this.prisma.challenge.update({
      where: { id },
      data: updateData,
    });

    // Tạo lại dữ liệu bảng con theo type (sử dụng type mới hoặc type cũ)
    const currentType = dto.type || existingChallenge.type;
    
    if (currentType === 'quiz' && dto.questions) {
      if (dto.questions.length === 0) {
        throw new BadRequestException('Quiz type requires at least one question');
      }
      await Promise.all(
        dto.questions.map(async (q) => {
          if (!q.question) return; // Skip incomplete questions
          const question = await this.prisma.challengeQuestion.create({
            data: {
              challenge_id: challenge.id,
              question: q.question,
              explanation: q.explanation ?? null,
            },
          });
          if (q.answers && q.answers.length > 0) {
            await this.prisma.challengeAnswer.createMany({
              data: q.answers.filter(a => a.answer).map((a) => ({
                challenge_question_id: question.id,
                answer: a.answer!,
                is_correct: a.is_correct ?? false,
              })),
            });
          }
        }),
      );
    }
    
    if (currentType === 'puzzle' && dto.puzzle) {
      if (!dto.puzzle.instruction || !dto.puzzle.image) {
        throw new BadRequestException('Puzzle requires instruction and image');
      }
      await this.prisma.puzzleChallenge.create({
        data: {
          challenge_id: challenge.id,
          instruction: dto.puzzle.instruction,
          image: dto.puzzle.image,
        },
      });
    }
    
    if (currentType === 'ordering' && dto.ordering) {
      if (!dto.ordering.instruction) {
        throw new BadRequestException('Ordering requires instruction');
      }
      const ordering = await this.prisma.orderingChallenge.create({
        data: {
          challenge_id: challenge.id,
          instruction: dto.ordering.instruction,
        },
      });
      if (dto.ordering.items?.length) {
        // Validate ordering items
        const validItems = dto.ordering.items.filter(item => item.content && item.correct_order !== undefined);
        const orderNumbers = validItems.map(item => item.correct_order!);
        const uniqueOrders = new Set(orderNumbers);
        if (uniqueOrders.size !== orderNumbers.length) {
          throw new BadRequestException('Ordering items must have unique correct_order values');
        }
        
        await this.prisma.orderingItem.createMany({
          data: validItems.map((item) => ({
            ordering_id: ordering.id,
            content: item.content!,
            correct_order: item.correct_order!,
          })),
        });
      }
    }
    
    if (currentType === 'fillBlank' && dto.fillBlank) {
      const fillBlank = await this.prisma.fillBlankChallenge.create({
        data: {
          challenge_id: challenge.id,
        },
      });
      if (dto.fillBlank.questions?.length) {
        await this.prisma.fillBlankQuestion.createMany({
          data: dto.fillBlank.questions.filter(q => q.sentence && q.correct_word).map((q) => ({
            challenge_id: fillBlank.id,
            sentence: q.sentence!,
            correct_word: q.correct_word!,
          })),
        });
      }
    }

    return challenge;
  }

  async remove(id: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Kiểm tra xem có user nào đã làm challenge này chưa
    const challengeScores = await this.prisma.challengeScore.count({
      where: { challenge_id: id }
    });

    if (challengeScores > 0) {
      // Nếu có người đã làm rồi thì chỉ được archive
      await this.prisma.challenge.update({
        where: { id },
        data: { status: 'archived' as ChallengeStatus }
      });
      return { message: 'Challenge has been archived because users have completed it' };
    }

    // Nếu chưa có ai làm thì có thể xóa cứng
    // Xóa toàn bộ question/answer liên quan
    const oldQuestions = await this.prisma.challengeQuestion.findMany({ where: { challenge_id: id } });
    for (const q of oldQuestions) {
      await this.prisma.challengeAnswer.deleteMany({ where: { challenge_question_id: q.id } });
    }
    await this.prisma.challengeQuestion.deleteMany({ where: { challenge_id: id } });

    // Xóa bảng con
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

    // Xóa challenge
    await this.prisma.challenge.delete({ where: { id } });
    return { message: 'Challenge deleted successfully' };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/[\s_-]+/g, '-') // Thay thế khoảng trắng và gạch dưới bằng gạch ngang
      .replace(/^-+|-+$/g, ''); // Loại bỏ gạch ngang ở đầu và cuối
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.challenge.findUnique({
        where: { slug },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async getUserScores(query: UserScoresQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Build where condition for users
    const where = {
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as any } },
          { email: { contains: search, mode: 'insensitive' as any } }
        ]
      })
    };

    // Get users with their scores
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        createdAt: true,
        challengeScore: {
          include: {
            challenge: {
              select: {
                type: true
              }
            }
          }
        },
        userLessonScore: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate scores for each user
    const usersWithScores = users.map(user => {
      // Challenge scores by type
      const challengeScores = { quiz: 0, puzzle: 0, ordering: 0, fillBlank: 0, total: 0 };
      
      user.challengeScore.forEach(score => {
        const type = score.challenge.type;
        challengeScores[type] += score.score;
        challengeScores.total += score.score;
      });

      // Lesson scores
      const lessonScore = user.userLessonScore.reduce((sum, score) => sum + score.score, 0);

      // Total score
      const totalScore = challengeScores.total + lessonScore;

      return {
        id: user.id,
        name: user.fullName,
        email: user.email,
        avatar: user.avatar,
        scores: {
          quiz: challengeScores.quiz,
          puzzle: challengeScores.puzzle,
          ordering: challengeScores.ordering,
          fillBlank: challengeScores.fillBlank,
          lesson: lessonScore,
          total: totalScore
        },
        completedChallenges: user.challengeScore.length,
        completedLessons: user.userLessonScore.length,
        createdAt: user.createdAt
      };
    });

    // Add ranking
    const rankedUsers = usersWithScores.map((user, index) => ({
      ...user,
      rank: index + 1 + skip
    }));

    // Apply pagination
    const paginatedUsers = rankedUsers.slice(skip, skip + limit);
    const total = usersWithScores.length;

    return {
      data: paginatedUsers,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
