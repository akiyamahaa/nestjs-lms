import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus } from 'generated/prisma';
import { getFullUrl, getSettingValue } from 'src/common/helpers/helper';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}


async findAllForUser(filter: { category_id?: string; search?: string, page?: number, perPage?: number, sort?: string }) {
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

    let orderBy: any = { created_at: 'desc' }; // mặc định mới nhất
    if (filter.sort === 'popular') {
      orderBy = { enrollments: { _count: 'desc' } }; // phổ biến nhất
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
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

    // Kiểm tra trạng thái hoàn thành khóa học
    let isCompleted = false;
    if (userId) {
      const progress = await this.prisma.userCourseProgress.findUnique({
        where: { user_id_product_id: { user_id: userId, product_id: id } },
      });
      isCompleted = !!(progress && progress.completed_at);
    }

    // Đếm số người đã hoàn thành khóa học
    const completedCount = await this.prisma.userCourseProgress.count({
      where: { product_id: id, completed_at: { not: null } },
    });

    // Đếm số bài lesson quiz và số bài giảng
    let quizLessonCount = 0;
    let lectureLessonCount = 0;
    let totalLessonCount = 0;
    if (product.modules) {
      for (const mod of product.modules) {
        if (mod.lessons) {
          for (const lesson of mod.lessons) {
            totalLessonCount++;
            if (lesson.type === 'quiz') quizLessonCount++;
            if (lesson.type === 'video' || lesson.type === 'content') lectureLessonCount++;
          }
        }
      }
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
      modules,
      isEnrolled,
      isCompleted,
      completedCount,
      quizLessonCount,
      lectureLessonCount,
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
    // 1. Update progress
    await this.prisma.userLessonProgress.upsert({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
      update: { completed_at: new Date() },
      create: { user_id: userId, lesson_id: lessonId, completed_at: new Date() },
    });

    // 2. Lấy lesson để biết type
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // 3. Lấy điểm từ setting
    let score = 0;
    if (lesson.type === 'video') {
      score = await this.getSettingValue('score_video');
    } else if (lesson.type === 'content') {
      score = await this.getSettingValue('score_content');
    } else {
      // Nếu là quiz hoặc loại khác thì có thể bỏ qua hoặc xử lý riêng
      return;
    }

    // 4. Insert vào UserLessonScore (nếu chưa có thì tạo, nếu có thì update)
    await this.prisma.userLessonScore.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { score },
      create: { userId, lessonId, score },
    });

    // Lấy khóa học của bài học này
    const lessonDetail = await this.prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: { include: { course: true } } } });
    const courseId = lessonDetail?.module?.course?.id;
    if (!courseId) return { message: 'Lesson progress updated, but course not found' };

    // Kiểm tra số lượng bài học đã hoàn thành
    const totalLessons = await this.prisma.lesson.count({ where: { module: { course_id: courseId }, deleted_at: null, status: 'published' } });
    const learnedLessons = await this.prisma.userLessonProgress.count({ where: { user_id: userId, lesson: { module: { course_id: courseId } }, completed_at: { not: null } } });

    // Nếu đã học hết thì đánh dấu hoàn thành khóa học
    if (totalLessons > 0 && learnedLessons === totalLessons) {
      await this.prisma.userCourseProgress.upsert({
        where: { user_id_product_id: { user_id: userId, product_id: courseId } },
        update: { completed_at: new Date() },
        create: { user_id: userId, product_id: courseId, completed_at: new Date() },
      });
    }

    return { message: 'Lesson progress updated successfully' };
  }

  async getSettingValue(key: string): Promise<number> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    return setting ? Number(setting.value) : 0;
  }

  async submitQuiz(userId: string, lessonId: string, answers) {
    // Lấy danh sách câu hỏi và đáp án đúng
    const questions = await this.prisma.quizQuestion.findMany({
      where: { lesson_id: lessonId },
      include: { answers: true },
    });
    if (!questions.length) throw new NotFoundException('No quiz questions found');

    // Tính số câu đúng
    let correctCount = 0;
    for (const q of questions) {
      const userAnswer = answers.find(a => a.questionId === q.id);
      if (!userAnswer) continue;
      const answerList = q.answers ?? [];
      const correct = answerList.find(ans => ans.is_correct);
      if (correct && userAnswer.answerId === correct.id) correctCount++;
    }

    // Tính điểm: ví dụ mỗi câu đúng được 1 điểm
    const score = correctCount;

    // Lưu điểm vào UserLessonScore
    await this.prisma.userLessonScore.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { score },
      create: { userId, lessonId, score },
    });

    // Cập nhật tiến trình học bài
    await this.prisma.userLessonProgress.upsert({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
      update: { completed_at: new Date() },
      create: { user_id: userId, lesson_id: lessonId, completed_at: new Date() },
    });

    // Lấy khóa học của bài học này
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: { include: { course: true } } } });
    const courseId = lesson?.module?.course?.id;
    if (!courseId) return { message: 'Quiz submitted, but course not found' };

    // Kiểm tra số lượng bài học đã hoàn thành
    const totalLessons = await this.prisma.lesson.count({ where: { module: { course_id: courseId }, deleted_at: null, status: 'published' } });
    const learnedLessons = await this.prisma.userLessonProgress.count({ where: { user_id: userId, lesson: { module: { course_id: courseId } }, completed_at: { not: null } } });

    // Nếu đã học hết thì đánh dấu hoàn thành khóa học
    if (totalLessons > 0 && learnedLessons === totalLessons) {
      await this.prisma.userCourseProgress.upsert({
        where: { user_id_product_id: { user_id: userId, product_id: courseId } },
        update: { completed_at: new Date() },
        create: { user_id: userId, product_id: courseId, completed_at: new Date() },
      });
    }

    return { message: 'Quiz submitted and checked course completion' };
  }
}
