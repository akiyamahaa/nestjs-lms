import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class AdminProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: { deleted_at: null },
      include: { modules: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique(
      { 
        where: { id } ,
        include: { modules: true }
      }
    );
    if (!product || product.deleted_at) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: CreateProductDto) {
    const { modules, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        modules: modules && modules.length > 0
          ? {
              create: modules.map((m) => ({
                title: m.title,
                short_description: m.short_description,
                order: m.order ?? 0,
              })),
            }
          : undefined,
      },
      include: { modules: true },
    });
  }

  async update(id: string, data: Partial<CreateProductDto>) {
    const { modules, ...productData } = data;

    // Nếu có modules, xử lý nested update
    if (modules && Array.isArray(modules)) {
      // Xóa hết modules cũ, tạo lại (cách đơn giản, phù hợp nếu số lượng modules không quá lớn)
      await this.prisma.module.deleteMany({ where: { course_id: id } });

      return this.prisma.product.update({
        where: { id },
        data: {
          ...productData,
          modules: {
            create: modules.map((m) => ({
              title: m.title,
              short_description: m.short_description,
              order: m.order ?? 0,
              status: m.status ?? 'draft',
            })),
          },
          updated_at: new Date(),
        },
        include: { modules: true },
      });
    }

    // Nếu không có modules, chỉ update product
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        updated_at: new Date(),
      },
      include: { modules: true },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deleted_at) throw new NotFoundException('Product not found');
    return this.prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
