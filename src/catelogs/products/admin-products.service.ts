import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminProductQueryDto } from './dto/admin-product-query.dto';
import { LessonType, ProductStatus, LessonStatus, ModuleStatus, Prisma, PrismaClient } from 'generated/prisma';
import { getFullUrl } from '../../common/helpers/helper';

@Injectable()
export class AdminProductsService {
  constructor(private tenantService: TenantService) {}

  private async getTenantPrisma(): Promise<PrismaClient> {
    return await this.tenantService.getPrismaClient();
  }

  async findAll(query: AdminProductQueryDto) {
    const prisma = await this.getTenantPrisma();
    
    const { page = 1, limit = 10, search, category_id, status, sort_by = 'created_at', sort_order = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where: Prisma.ProductWhereInput = {
      deleted_at: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { short_description: { contains: search, mode: Prisma.QueryMode.insensitive } }
        ]
      }),
      ...(category_id && { category_id }),
      ...(status && { status })
    };

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        modules: {
          select: {
            id: true,
            title: true,
            lessons: {
              select: {
                id: true,
                type: true
              }
            },
            _count: {
              select: {
                lessons: true
              }
            }
          }
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            reviews: true
          }
        }
      },
      orderBy: { [sort_by]: sort_order },
      skip,
      take: limit,
    });

    return {
      data: products.map(product => {
        // Đếm lessons theo loại cho từng product
        const allLessons = product.modules.flatMap(module => module.lessons);
        const lessonsByType = allLessons.reduce((acc, lesson) => {
          acc[lesson.type] = (acc[lesson.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Đảm bảo có đủ 3 loại lesson với giá trị mặc định là 0
        const lessonTypes = {
          video: lessonsByType.video || 0,
          quiz: lessonsByType.quiz || 0,
          content: lessonsByType.content || 0
        };

        return {
          ...product,
          thumbnail: getFullUrl(product.thumbnail),
          modules: product.modules.map(module => ({
            id: module.id,
            title: module.title,
            _count: module._count
          })), // Remove lessons from modules to avoid exposing too much data
          stats: {
            totalModules: product._count.modules,
            totalEnrollments: product._count.enrollments,
            totalReviews: product._count.reviews,
            totalLessons: product.modules.reduce((sum, module) => sum + module._count.lessons, 0),
            lessonsByType: lessonTypes
          }
        };
      }),
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const prisma = await this.getTenantPrisma();
    
    const [total, published, draft, archived, withEnrollments] = await Promise.all([
      prisma.product.count({ where: { deleted_at: null } }),
      prisma.product.count({ where: { deleted_at: null, status: 'published' } }),
      prisma.product.count({ where: { deleted_at: null, status: 'draft' } }),
      prisma.product.count({ where: { deleted_at: null, status: 'archived' } }),
      prisma.product.count({ 
        where: { 
          deleted_at: null,
          enrollments: {
            some: {}
          }
        } 
      })
    ]);

    const recentProducts = await prisma.product.findMany({
      where: { deleted_at: null },
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        created_at: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    return {
      total,
      published,
      draft,
      archived,
      withEnrollments,
      withoutEnrollments: total - withEnrollments,
      recentProducts
    };
  }

  async findOne(id: string) {
    const prisma = await this.getTenantPrisma();
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        category: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        modules: {
          include: {
            lessons: {
              include: {
                question: {
                  include: { 
                    answers: {
                      orderBy: { id: 'asc' }
                    }
                  },
                },
              },
              orderBy: { order: 'asc' }
            },
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            reviews: true
          }
        }
      }
    });
    
    if (!product || product.deleted_at) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...product,
      thumbnail: getFullUrl(product.thumbnail),
      stats: {
        totalModules: product._count.modules,
        totalEnrollments: product._count.enrollments,
        totalReviews: product._count.reviews,
        totalLessons: product.modules.reduce((sum, module) => sum + module.lessons.length, 0)
      }
    };
  }

  async create(data: CreateProductDto) {
    const prisma = await this.getTenantPrisma();
    
    const { modules, ...productData } = data;
    
    // Always generate unique slug, even if slug is provided
    if (productData.title) {
      productData.slug = await this.generateUniqueSlug(productData.title);
    }

    try {
      return await prisma.product.create({
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
    } catch (error) {
      // If still get unique constraint error, try with a timestamp suffix
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        productData.slug = `${productData.slug}-${Date.now()}`;
        return prisma.product.create({
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
                      : ModuleStatus.published,
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
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateProductDto>) {
    const prisma = await this.getTenantPrisma();
    
    const { modules, ...productData } = data;

    // Generate unique slug if title is updated and no slug provided
    if (productData.title && !productData.slug) {
      productData.slug = await this.generateUniqueSlug(productData.title, id);
    }

    if (modules && Array.isArray(modules)) {
      // Xóa quiz_answers trước
      await prisma.quizAnswer.deleteMany({
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
      await prisma.quizQuestion.deleteMany({
        where: {
          lesson: {
            module: {
              course_id: id,
            },
          },
        },
      });
      // Xóa lessons
      await prisma.lesson.deleteMany({
        where: {
          module: {
            course_id: id,
          },
        },
      });
      // Xóa modules
      await prisma.module.deleteMany({
        where: { course_id: id },
      });

      return prisma.product.update({
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
                : ModuleStatus.published,
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

    return prisma.product.update({
      where: { id },
      data: {
        ...productData,
        updated_at: new Date(),
      },
      include: { modules: true },
    });
  }

  async remove(id: string) {
    const prisma = await this.getTenantPrisma();
    
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.deleted_at) throw new NotFoundException('Product not found');
    return prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD') // Normalize unicode characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .trim(); // Remove leading/trailing spaces
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const prisma = await this.getTenantPrisma();
    
    let slug = this.generateSlug(title);
    
    // If slug is empty after processing, use a default
    if (!slug) {
      slug = 'product';
    }
    
    let counter = 1;
    let uniqueSlug = slug;

    // Limit the loop to prevent infinite loops
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          slug: uniqueSlug,
          deleted_at: null,
          ...(excludeId && { id: { not: excludeId } })
        }
      });

      if (!existingProduct) {
        break;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
      attempts++;
    }

    // If we've exceeded max attempts, add timestamp
    if (attempts >= maxAttempts) {
      uniqueSlug = `${slug}-${Date.now()}`;
    }

    return uniqueSlug;
  }
}
