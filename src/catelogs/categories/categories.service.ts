import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaClient } from 'generated/prisma';
import { CategoryStatus } from './enums/category-status.enum';

@Injectable()
export class CategoriesService {
  constructor(private tenantService: TenantService) {}

  private async getTenantPrisma(): Promise<PrismaClient> {
    return await this.tenantService.getPrismaClient();
  }

  async findAll() {
    const prisma = await this.getTenantPrisma();
    return prisma.category.findMany({
      where: { deleted_at: null, status: CategoryStatus.PUBLISHED },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const prisma = await this.getTenantPrisma();
    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category || category.deleted_at) throw new NotFoundException('Category not found');
    return category;
  }

  async enroll(userId: string, courseId: string) {
    const prisma = await this.getTenantPrisma();
    // Kiểm tra đã đăng ký chưa
    const existed = await prisma.enrollment.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: courseId } },
    });
    if (existed) throw new Error('Already enrolled');
    return prisma.enrollment.create({
      data: { user_id: userId, product_id: courseId },
    });
  }

  async getMyEnrollments(userId: string) {
    const prisma = await this.getTenantPrisma();
    return prisma.enrollment.findMany({
      where: { user_id: userId },
      include: { product: true },
    });
  }

  async isEnrolled(userId: string, productId: string) {
    const prisma = await this.getTenantPrisma();
    const existed = await prisma.enrollment.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: productId } },
    });
    return !!existed;
  }
}
