import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getFullUrl } from 'src/common/helpers/helper';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: string, courseId: string) {
    const existed = await this.prisma.enrollment.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: courseId } },
    });
    if (existed) throw new ConflictException('Already enrolled');
    return this.prisma.enrollment.create({
      data: { user_id: userId, product_id: courseId },
    });
  }

  async getMyEnrollments(userId: string, status?: string) {
    // Lấy danh sách khóa học đã đăng ký
    const enrollments = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: { 
        product: {
          include: {
            modules: {
              where: { status: 'published', deleted_at: null },
              include: {
                lessons: {
                  where: { status: 'published', deleted_at: null }
                }
              }
            }
          }
        }
      },
    });

    // Tính toán tiến trình cho từng khóa học
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const product = enrollment.product;
        
        // Đếm tổng số bài học
        const totalLessons = product.modules.reduce((sum, module) => 
          sum + module.lessons.length, 0
        );

        // Đếm số bài học đã hoàn thành
        const completedLessons = await this.prisma.userLessonProgress.count({
          where: {
            user_id: userId,
            lesson: {
              module: { course_id: product.id },
              status: 'published',
              deleted_at: null
            },
            completed_at: { not: null }
          }
        });

        // Tính phần trăm hoàn thành
        const completionPercentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0;

        // Kiểm tra trạng thái hoàn thành khóa học
        const courseProgress = await this.prisma.userCourseProgress.findUnique({
          where: { user_id_product_id: { user_id: userId, product_id: product.id } }
        });
        const isCompleted = !!(courseProgress && courseProgress.completed_at);

        return {
          ...enrollment,
          product: {
            ...product,
            thumbnail: getFullUrl(product.thumbnail),
          },
          totalLessons,
          completedLessons,
          completionPercentage,
          isCompleted,
          enrolledAt: enrollment.created_at,
        };
      })
    );

    // Lọc theo trạng thái nếu có
    let filteredCourses = coursesWithProgress;
    if (status === 'completed') {
      filteredCourses = coursesWithProgress.filter(course => course.isCompleted);
    } else if (status === 'learning') {
      filteredCourses = coursesWithProgress.filter(course => 
        !course.isCompleted && course.completionPercentage > 0
      );
    }
    // status === 'all' hoặc không có status thì trả về tất cả

    return {
      total: filteredCourses.length,
      courses: filteredCourses,
    };
  }
}