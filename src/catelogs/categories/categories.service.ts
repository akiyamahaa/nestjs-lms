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

}
