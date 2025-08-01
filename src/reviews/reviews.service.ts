import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

async createReview(userId: string, productId: string, rating: number, comment?: string) {
    // Kiểm tra đã đăng ký khóa học chưa
    console.log('userId', userId, 'productId', productId);
    const enrollment = await this.prisma.enrollment.findUnique({
        where: { user_id_product_id: { user_id: userId, product_id: productId } },
    });
    if (!enrollment) throw new ConflictException('You can only review courses you have registered for');

    // Kiểm tra đã review chưa
    const existed = await this.prisma.review.findUnique({
        where: { user_id_product_id: { user_id: userId, product_id: productId } },
    });
    if (existed) throw new ConflictException('You have already reviewed this course');

    // Tạo review
    const review = await this.prisma.review.create({
        data: { user_id: userId, product_id: productId, rating, comment },
    });
    // Cập nhật rating trung bình cho product
    // await this.updateProductRating(productId);
    return review;
}

  async getProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { product_id: productId },
      include: { user: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async getFiveStarLatest(limit: number = 10) {
    // Lấy base url
    const baseUrl = process.env.BASE_URL || 'http://localhost:5005';
    // Lấy review có rating cao nhất (nếu nhiều thì lấy mới nhất)
    const reviews = await this.prisma.review.findMany({
      where: {
        status: true,
      },
      orderBy: [
        { rating: 'desc' },
        { created_at: 'desc' },
      ],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        // product: true,
      },
    });
    // Nối avatar và thumbnail với base url
    return reviews.map((r) => ({
      ...r,
      user: r.user ? { ...r.user, avatar: r.user.avatar ? `${baseUrl.replace(/\/$/, '')}/${r.user.avatar.replace(/^\/+/, '')}` : null } : null,
    }));
  }

  async getUserReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { user_id: userId },
      include: { 
        product: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          }
        }
      },
      orderBy: { created_at: 'desc' },
    });
  }

}
