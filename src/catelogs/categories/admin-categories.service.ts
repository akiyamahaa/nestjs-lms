import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryStatus } from './enums/category-status.enum';
import { getFullUrl } from '../../common/helpers/helper';

@Injectable()
export class AdminCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryDto) {
    // Tạo slug tự động nếu không được cung cấp
    const slug = data.slug || this.generateSlug(data.title);

    // Kiểm tra slug đã tồn tại chưa
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug }
    });

    if (existingCategory && !existingCategory.deleted_at) {
      throw new ConflictException('Slug đã tồn tại');
    }

    return this.prisma.category.create({ 
      data: {
        title: data.title,
        slug,
        short_description: data.short_description,
        status: data.status || 'draft'
      }
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/[\s_-]+/g, '-') // Thay thế khoảng trắng và gạch dưới bằng gạch ngang
      .replace(/^-+|-+$/g, ''); // Loại bỏ gạch ngang ở đầu và cuối
  }

  async findAll(page = 1, limit = 10, search?: string, status?: CategoryStatus) {
    const skip = (page - 1) * limit;
    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      this.prisma.category.count({ where })
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getStats() {
    const [total, published, draft, archived, withProducts] = await Promise.all([
      this.prisma.category.count({ where: { deleted_at: null } }),
      this.prisma.category.count({ where: { deleted_at: null, status: 'published' } }),
      this.prisma.category.count({ where: { deleted_at: null, status: 'draft' } }),
      this.prisma.category.count({ where: { deleted_at: null, status: 'archived' } }),
      this.prisma.category.count({ 
        where: { 
          deleted_at: null,
          products: {
            some: {}
          }
        } 
      })
    ]);

    return {
      total,
      published,
      draft,
      archived,
      withProducts,
      withoutProducts: total - withProducts
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { deleted_at: null },
          select: {
            id: true,
            title: true,
            status: true,
            created_at: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    if (!category || category.deleted_at) {
      throw new NotFoundException('Category not found');
    }
    
    return category;
  }

  async update(id: string, data: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    
    if (!category || category.deleted_at) {
      throw new NotFoundException('Category not found');
    }

    // Chuẩn bị data để update
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.short_description !== undefined) updateData.short_description = data.short_description;
    if (data.status !== undefined) updateData.status = data.status;
    
    // Xử lý slug
    if (data.slug !== undefined) {
      const slugToUpdate = data.slug || this.generateSlug(data.title || category.title);
      
      // Kiểm tra slug nếu có thay đổi
      if (slugToUpdate !== category.slug) {
        const existingCategory = await this.prisma.category.findUnique({
          where: { slug: slugToUpdate }
        });

        if (existingCategory && !existingCategory.deleted_at && existingCategory.id !== id) {
          throw new ConflictException('Slug đã tồn tại');
        }
      }
      
      updateData.slug = slugToUpdate;
    }

    updateData.updated_at = new Date();

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    if (!category || category.deleted_at) {
      throw new NotFoundException('Category not found');
    }

    // Kiểm tra xem có sản phẩm nào đang sử dụng category này không
    if (category._count.products > 0) {
      throw new ConflictException('Không thể xóa danh mục đang có sản phẩm');
    }

    // Soft-delete
    return this.prisma.category.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.deleted_at) {
      throw new ConflictException('Category is not deleted');
    }

    return this.prisma.category.update({
      where: { id },
      data: { 
        deleted_at: null,
        updated_at: new Date()
      },
    });
  }

  async getDeleted(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { deleted_at: { not: null } };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deleted_at: 'desc' },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      this.prisma.category.count({ where })
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
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
