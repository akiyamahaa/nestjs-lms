import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryStatus } from './enums/category-status.enum';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { deleted_at: null, status: CategoryStatus.PUBLISHED },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category || category.deleted_at) throw new NotFoundException('Category not found');
    return category;
  }

  async enroll(userId: string, courseId: string) {
    // Kiểm tra đã đăng ký chưa
    const existed = await this.prisma.enrollment.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: courseId } },
    });
    if (existed) throw new Error('Already enrolled');
    return this.prisma.enrollment.create({
      data: { user_id: userId, product_id: courseId },
    });
  }

  async getMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: { product: true },
    });
  }

  async isEnrolled(userId: string, productId: string) {
    const existed = await this.prisma.enrollment.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: productId } },
    });
    return !!existed;
  }
}
