import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryStatus } from './enums/category-status.enum';

@Injectable()
export class AdminCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryDto) {
    return this.prisma.category.create({ data });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { deleted_at: null },
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

  async update(id: string, data: Partial<CreateCategoryDto>) {

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.deleted_at) throw new NotFoundException('Category not found');
    return this.prisma.category.update({
      where: { id },
      data: { ...data, updated_at: new Date() },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.deleted_at) throw new NotFoundException('Category not found');
    // Soft-delete
    return this.prisma.category.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async changeStatus(id: string, status: CategoryStatus) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.deleted_at) throw new NotFoundException('Category not found');
    return this.prisma.category.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
  }
}
