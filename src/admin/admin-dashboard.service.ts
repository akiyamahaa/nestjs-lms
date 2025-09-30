import { Injectable } from '@nestjs/common';
import { TenantService } from '../common/services/tenant.service';
import { PrismaClient } from 'generated/prisma';
import { getFullUrl } from '../common/helpers/helper';

@Injectable()
export class AdminDashboardService {
  constructor(private tenantService: TenantService) {}

  private async getTenantPrisma(): Promise<PrismaClient> {
    return await this.tenantService.getPrismaClient();
  }

  async getDashboardStats() {
    const prisma = await this.getTenantPrisma();
    
    // Lấy ngày đầu tháng hiện tại
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Lấy ngày đầu tháng trước
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    // Lấy ngày hôm nay (từ 00:00 đến 23:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      // Tổng khóa học
      totalCourses,
      totalCoursesLastMonth,
      
      // Tổng khách hàng (users)
      totalUsers,
      totalUsersLastMonth,
      
      // Tình trạng học (enrollments)
      totalEnrollments,
      totalEnrollmentsLastMonth,
      newEnrollmentsToday,
      
      // Doanh thu mới (giả sử có bảng orders hoặc payments)
      // Tạm thời sử dụng số lượng enrollments
      // avgCoursePrice,
      
      // Đánh giá
      totalReviews,
      totalReviewsLastMonth,
      avgRating,
      
      // Thống kê chi tiết
      coursesByStatus,
      recentEnrollments,
      topRatedCourses,
      
    ] = await Promise.all([
      // Tổng khóa học
      prisma.product.count({
        where: { deleted_at: null }
      }),
      prisma.product.count({
        where: { 
          deleted_at: null,
          created_at: { lt: startOfMonth }
        }
      }),
      
      // Tổng khách hàng
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { lt: startOfMonth }
        }
      }),
      
      // Tổng đăng ký
      prisma.enrollment.count(),
      prisma.enrollment.count({
        where: {
          created_at: { lt: startOfMonth }
        }
      }),
      
      // Đăng ký mới hôm nay
      prisma.enrollment.count({
        where: {
          created_at: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      }),
      
      // Giá trung bình khóa học (bỏ qua vì không có trường price)
      // prisma.product.aggregate({
      //   _avg: { price: true },
      //   where: { deleted_at: null }
      // }),
      
      // Đánh giá
      prisma.review.count(),
      prisma.review.count({
        where: {
          created_at: { lt: startOfMonth }
        }
      }),
      prisma.review.aggregate({
        _avg: { rating: true }
      }),
      
      // Chi tiết khóa học theo status
      prisma.product.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { deleted_at: null }
      }),
      
      // Đăng ký gần đây
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatar: true
            }
          },
          product: {
            select: {
              id: true,
              title: true,
              thumbnail: true
            }
          }
        }
      }),
      
      // Top khóa học được đánh giá cao
      prisma.product.findMany({
        take: 5,
        where: { 
          deleted_at: null,
          reviews: {
            some: {}
          }
        },
        include: {
          reviews: {
            select: { rating: true }
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true
            }
          }
        }
      })
    ]);

    // Tính toán tăng trưởng
    const coursesGrowth = totalCoursesLastMonth > 0 
      ? ((totalCourses - totalCoursesLastMonth) / totalCoursesLastMonth * 100)
      : 0;
      
    const usersGrowth = totalUsersLastMonth > 0 
      ? ((totalUsers - totalUsersLastMonth) / totalUsersLastMonth * 100)
      : 0;
      
    const enrollmentsGrowth = totalEnrollmentsLastMonth > 0 
      ? ((totalEnrollments - totalEnrollmentsLastMonth) / totalEnrollmentsLastMonth * 100)
      : 0;
      
    const reviewsGrowth = totalReviewsLastMonth > 0 
      ? ((totalReviews - totalReviewsLastMonth) / totalReviewsLastMonth * 100)
      : 0;

    // Tính doanh thu ước tính (sử dụng số lượng enrollments làm proxy)
    const estimatedRevenue = totalEnrollments; // Hoặc có thể nhân với một giá trị cố định
    const lastMonthRevenue = totalEnrollmentsLastMonth;
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((estimatedRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
      : 0;

    // Format courses by status
    const coursesStats = {
      published: 0,
      draft: 0,
      archived: 0
    };
    coursesByStatus.forEach(item => {
      coursesStats[item.status] = item._count.status;
    });

    // Format top rated courses
    const topRated = topRatedCourses
      .map(course => ({
        ...course,
        thumbnail: getFullUrl(course.thumbnail),
        avgRating: course.reviews.length > 0 
          ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
          : 0
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    return {
      overview: {
        totalCourses: {
          value: totalCourses,
          growth: coursesGrowth,
          label: 'Tổng khóa học'
        },
        totalUsers: {
          value: totalUsers,
          growth: usersGrowth,
          label: 'Tổng khách hàng'
        },
        newEnrollmentsToday: {
          value: newEnrollmentsToday,
          label: 'Đăng ký mới hôm nay'
        },
        totalEnrollments: {
          value: totalEnrollments,
          growth: enrollmentsGrowth,
          label: 'Tổng đăng ký'
        },
        totalReviews: {
          value: totalReviews,
          growth: reviewsGrowth,
          label: 'Đánh giá',
          avgRating: avgRating._avg.rating || 0
        }
      },
    };
  }

  async getTopUsersByScore(limit: number = 5) {
    const prisma = await this.getTenantPrisma();
    
    // Lấy điểm từ challenges
    const challengeScores = await prisma.challengeScore.groupBy({
      by: ['user_id'],
      _sum: {
        score: true
      }
    });

    // Lấy điểm từ lessons
    const lessonScores = await prisma.userLessonScore.groupBy({
      by: ['userId'],
      _sum: {
        score: true
      }
    });

    // Tạo map điểm cho từng user
    const userScoresMap = new Map<string, number>();
    
    // Cộng điểm challenges
    challengeScores.forEach(score => {
      const totalScore = score._sum.score || 0;
      userScoresMap.set(score.user_id, totalScore);
    });

    // Cộng điểm lessons
    lessonScores.forEach(score => {
      const lessonScore = score._sum?.score || 0;
      const currentScore = userScoresMap.get(score.userId) || 0;
      userScoresMap.set(score.userId, currentScore + lessonScore);
    });

    // Lấy top users theo điểm
    const sortedUsers = Array.from(userScoresMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    // Lấy thông tin user
    const userIds = sortedUsers.map(([userId]) => userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        email: true
      }
    });

    // Format kết quả với rank
    const topUsers = sortedUsers.map(([userId, totalScore], index) => {
      const user = users.find(u => u.id === userId);
      return {
        rank: index + 1,
        user: {
          id: userId,
          fullName: user?.fullName || 'Unknown User',
          avatar: getFullUrl(user?.avatar || null),
          email: user?.email
        },
        totalScore: totalScore,
        formattedScore: totalScore.toLocaleString() // Format với dấu phẩy
      };
    });

    return topUsers;
  }
}
