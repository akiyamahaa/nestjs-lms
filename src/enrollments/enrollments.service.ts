import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async getMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: { product: true },
    });
  }
}