import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LessonType, ProductStatus, LessonStatus, ModuleStatus } from 'generated/prisma';

@Injectable()
export class AdminProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: { deleted_at: null },
      include: { modules: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique(
      { 
        where: { id } ,
        include: { modules: true }
      }
    );
    if (!product || product.deleted_at) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: CreateProductDto) {
    const { modules, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        modules: modules && modules.length > 0
          ? {
              create: modules.map((m) => ({
                title: m.title,
                short_description: m.short_description,
                order: m.order ?? 0,
                status: m.status
                  ? (typeof m.status === 'string'
                      ? ModuleStatus[m.status as keyof typeof ModuleStatus]
                      : m.status)
                  : ModuleStatus.draft,
                lessons: m.lessons && m.lessons.length > 0
                  ? {
                      create: m.lessons.map((l) => ({
                        title: l.title,
                        description: l.description ?? '',
                        type: typeof l.type === 'string'
                          ? LessonType[l.type as keyof typeof LessonType]
                          : l.type,
                        is_previewable: l.is_previewable ?? false,
                        status: l.status
                          ? (typeof l.status === 'string'
                              ? LessonStatus[l.status as keyof typeof LessonStatus]
                              : l.status)
                          : LessonStatus.draft,
                        order: l.order ?? 0,
                        attachment: l.attachment ?? null,
                        question: l.quiz_questions && l.quiz_questions.length > 0
                          ? {
                              create: l.quiz_questions.map((q) => ({
                                question: q.question,
                                explanation: q.explanation ?? null,
                                answers: q.answers && q.answers.length > 0
                                  ? {
                                      create: q.answers.map((a) => ({
                                        answer: a,
                                        is_correct: a === q.correct_answer,
                                      })),
                                    }
                                  : undefined,
                              })),
                            }
                          : undefined,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                question: {
                  include: { answers: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<CreateProductDto>) {
    const { modules, ...productData } = data;

    if (modules && Array.isArray(modules)) {
      // Xóa quiz_answers trước
      await this.prisma.quizAnswer.deleteMany({
        where: {
          quiz_question: {
            lesson: {
              module: {
                course_id: id,
              },
            },
          },
        },
      });
      // Xóa quiz_questions
      await this.prisma.quizQuestion.deleteMany({
        where: {
          lesson: {
            module: {
              course_id: id,
            },
          },
        },
      });
      // Xóa lessons
      await this.prisma.lesson.deleteMany({
        where: {
          module: {
            course_id: id,
          },
        },
      });
      // Xóa modules
      await this.prisma.module.deleteMany({
        where: { course_id: id },
      });

      return this.prisma.product.update({
        where: { id },
        data: {
          ...productData,
          modules: {
            create: modules.map((m) => ({
              title: m.title,
              short_description: m.short_description,
              order: m.order ?? 0,
              status: m.status
                ? (typeof m.status === 'string'
                    ? ModuleStatus[m.status as keyof typeof ModuleStatus]
                    : m.status)
                : ModuleStatus.draft,
              lessons: m.lessons && m.lessons.length > 0
                ? {
                    create: m.lessons.map((l) => ({
                      title: l.title,
                      description: l.description ?? '',
                      type: typeof l.type === 'string'
                        ? LessonType[l.type as keyof typeof LessonType]
                        : l.type,
                      is_previewable: l.is_previewable ?? false,
                      status: l.status
                        ? (typeof l.status === 'string'
                            ? LessonStatus[l.status as keyof typeof LessonStatus]
                            : l.status)
                        : LessonStatus.draft,
                      order: l.order ?? 0,
                      attachment: l.attachment ?? null,
                      question: l.quiz_questions && l.quiz_questions.length > 0
                        ? {
                            create: l.quiz_questions.map((q) => ({
                              question: q.question,
                              explanation: q.explanation ?? null,
                              answers: q.answers && q.answers.length > 0
                                ? {
                                    create: q.answers.map((a) => ({
                                      answer: a,
                                      is_correct: a === q.correct_answer,
                                    })),
                                  }
                                : undefined,
                            })),
                          }
                        : undefined,
                    })),
                  }
                : undefined,
            })),
          },
          updated_at: new Date(),
        },
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  question: {
                    include: { answers: true },
                  },
                },
              },
            },
          },
        },
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        updated_at: new Date(),
      },
      include: { modules: true },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deleted_at) throw new NotFoundException('Product not found');
    return this.prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
