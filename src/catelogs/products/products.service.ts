import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private getFullUrl(path: string) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5005';
    if (!path) return null;
    // Nếu path đã là url tuyệt đối thì giữ nguyên
    if (/^https?:\/\//.test(path)) return path;
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  async findAllForUser(filter: { category_id?: string; search?: string, page?: number, perPage?: number }) {
    const products = await this.prisma.product.findMany({
      where: {
        deleted_at: null,
        status: 'published',
        ...(filter.category_id && { category_id: filter.category_id }),
        ...(filter.search && { title: { contains: filter.search, mode: 'insensitive' } }),
      },
      orderBy: { created_at: 'desc' },
      include: { 
        modules: true,
        reviews: true,
      },
    });

    return products.map((p) => {
      const reviews = p.reviews || [];
      const reviewCount = reviews.length;
      const averageRating = reviewCount
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
        : 0;

      // Loại bỏ trường reviews khỏi kết quả trả về
      const { reviews: _removed, ...rest } = p;

      return {
        ...rest,
        thumbnail: this.getFullUrl(p.thumbnail),
        reviewCount,
        averageRating: Number(averageRating.toFixed(1)),
      };
    });
  }

  async findOneForUser(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { modules: { include: { lessons: true } } },
    });
    if (!product || product.deleted_at || product.status !== 'published') {
      throw new NotFoundException('Course not found');
    }
    
    return {
      ...product,
      thumbnail: this.getFullUrl(product.thumbnail),
    };
  }
}