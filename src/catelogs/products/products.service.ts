import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus } from 'generated/prisma';
import { getFullUrl } from 'src/common/helpers/helper';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}


  async findAllForUser(filter: { category_id?: string; search?: string, page?: number, perPage?: number }) {
    const page = filter.page && filter.page > 0 ? Number(filter.page) : 1;
    const perPage = filter.perPage && filter.perPage > 0 ? Number(filter.perPage) : 10;
    const where: any = {
      deleted_at: null,
      status: ProductStatus.published,
    };

    if (filter.category_id) {
      where.category_id = filter.category_id;
    }

    if (filter.search) {
      where.title = { contains: filter.search, mode: 'insensitive' };
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: { 
          reviews: true,
          enrollments: true,
          modules: {
            include: {
              lessons: true,
            }
          }
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const data = products.map((p: any) => {
      const reviews = p.reviews || [];
      const reviewCount = reviews.length;
      const averageRating = reviewCount
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
        : 0;

      // Đếm số người đã enroll
      const enrollmentCount = p.enrollments ? p.enrollments.length : 0;

      // Đếm tổng số bài học
      const lessonCount = p.modules
        ? p.modules.reduce((sum: number, m: any) => sum + (m.lessons ? m.lessons.length : 0), 0)
        : 0;

      // Loại bỏ trường reviews, enrollments, modules khỏi kết quả trả về nếu muốn
      const { reviews: _r, enrollments: _e, modules: _m, ...rest } = p;

      return {
        ...rest,
        thumbnail: getFullUrl(p.thumbnail),
        reviewCount,
        averageRating: Number(averageRating.toFixed(1)),
        enrollmentCount,
        lessonCount,
      };
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findOneForUser(id: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, status: ProductStatus.published },
      include: {
        modules: {
          where: { status: ProductStatus.published },
          include: {
            lessons: {
              where: { status: 'published' },
            }
          }
        },
        reviews: true,
        enrollments: true,
      },
    });
    if (!product || product.deleted_at || product.status !== 'published') {
      throw new NotFoundException('Course not found');
    }

    // Kiểm tra trạng thái đã đăng ký
    let isEnrolled = false;
    if (userId) {
      isEnrolled = product.enrollments?.some((e: any) => e.user_id === userId) ?? false;
    }

    const reviews = product.reviews || [];
    const reviewCount = reviews.length;
    const averageRating = reviewCount
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
      : 0;
    const ratingBreakdown = [1,2,3,4,5].reduce((acc, star) => {
      const count = reviews.filter(r => r.rating === star).length;
      acc[star] = reviewCount ? Number(((count / reviewCount) * 100).toFixed(1)) : 0;
      return acc;
    }, {} as Record<number, number>);

    const enrollmentCount = product.enrollments ? product.enrollments.length : 0;
    const lessonCount = product.modules
      ? product.modules.reduce((sum: number, m: any) => sum + (m.lessons ? m.lessons.length : 0), 0)
      : 0;

    // Nếu muốn xử lý thumbnail cho module/lesson thì map lại ở đây
    const modules = product.modules?.map((mod: any) => ({
      ...mod,
      lessons: mod.lessons?.map((lesson: any) => ({
        ...lesson,
        thumbnail: getFullUrl(lesson.thumbnail),
      })) ?? [],
    })) ?? [];

    const { reviews: _removed, enrollments: _e, modules: _m, ...rest } = product;

    return {
      ...rest,
      thumbnail: getFullUrl(product.thumbnail),
      reviews,
      reviewCount,
      averageRating: Number(averageRating.toFixed(1)),
      ratingBreakdown,
      enrollmentCount,
      lessonCount,
      modules, // Trả về danh sách module, mỗi module có mảng lessons riêng
      isEnrolled, // Trả về trạng thái đã đăng ký
    };
  }

  async findLessonDetailForUser(lessonId: string, userId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, status: 'published' },
      include: {
        question: { include: { answers: true } },
        module: true,
      },
    });
    if (!lesson || lesson.deleted_at || lesson.status !== 'published') {
      throw new NotFoundException('Lesson not found');
    }

    let isLearned = false;
    if (userId) {
      const progress = await this.prisma.userLessonProgress.findUnique({
        where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
      });
      isLearned = !!progress;
    }

    return {
      ...lesson,
      isLearned,
    };
  }

  
  async updateLessonProgress(userId: string, lessonId: string) {
    // Kiểm tra lesson có tồn tại không
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Upsert tiến trình học bài
    return this.prisma.userLessonProgress.upsert({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
      update: { completed_at: new Date() },
      create: { user_id: userId, lesson_id: lessonId, completed_at: new Date() },
    });
  }
}