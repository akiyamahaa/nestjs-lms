import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus } from 'generated/prisma';

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
    const page = filter.page && filter.page > 0 ? Number(filter.page) : 1;
    const perPage = filter.perPage && filter.perPage > 0 ? Number(filter.perPage) : 10;
    const where = {
      deleted_at: null,
      status: ProductStatus.published,
      ...(filter.category_id && { category_id: filter.category_id }),
      ...(filter.search && { title: { contains: filter.search } }),
    };

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where: { status: ProductStatus.published },
        orderBy: { created_at: 'desc' },
        include: { 
          reviews: true,
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const data = products.map((p: any) => {
      const reviews = p.reviews || [];
      const reviewCount = reviews.length;
      const averageRating = reviewCount
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
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

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findOneForUser(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, status: ProductStatus.published },
      include: {
        modules: {
          where: { status: ProductStatus.published },
          include: {
            lessons: {
              where: { status: 'published' },
              include: {
                question: { include: { answers: true } }
              }
            }
          }
        },
        reviews: true,
      },
    });
    if (!product || product.deleted_at || product.status !== 'published') {
      throw new NotFoundException('Course not found');
    }

    const reviews = product.reviews || [];
    const reviewCount = reviews.length;
    const averageRating = reviewCount
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
      : 0;
    const ratingBreakdown = [1,2,3,4,5].reduce((acc, star) => {
      const count = reviews.filter(r => r.rating === star).length;
      acc[star] = reviewCount ? Number(((count / reviewCount) * 100).toFixed(1)) : 0;
      return acc;
    }, {} as Record<number, number>);

    const { reviews: _removed, ...rest } = product;

    return {
      ...rest,
      thumbnail: this.getFullUrl(product.thumbnail),
      reviews,
      reviewCount,
      averageRating: Number(averageRating.toFixed(1)),
      ratingBreakdown,
    };
  }
}