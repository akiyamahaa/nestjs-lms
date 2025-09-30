import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantService } from '../common/services/tenant.service';
import { AdminReviewQueryDto } from './dto/admin-review-query.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { Prisma, PrismaClient } from 'generated/prisma';
import { getFullUrl } from '../common/helpers/helper';

@Injectable()
export class AdminReviewsService {
  constructor(private tenantService: TenantService) {}

  private async getTenantPrisma(): Promise<PrismaClient> {
    return await this.tenantService.getPrismaClient();
  }

  async findAll(query: AdminReviewQueryDto) {
    const prisma = await this.getTenantPrisma();
    
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      rating,
      product_id,
      user_id,
      sort_by = 'created_at', 
      sort_order = 'desc' 
    } = query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where: Prisma.ReviewWhereInput = {
      ...(search && {
        OR: [
          { 
            comment: { 
              contains: search, 
              mode: Prisma.QueryMode.insensitive 
            }
          },
          { 
            user: { 
              fullName: { 
                contains: search, 
                mode: Prisma.QueryMode.insensitive 
              }
            }
          },
          { 
            product: { 
              title: { 
                contains: search, 
                mode: Prisma.QueryMode.insensitive 
              }
            }
          }
        ]
      }),
      ...(status !== undefined && { status }),
      ...(rating && { rating }),
      ...(product_id && { product_id }),
      ...(user_id && { user_id })
    };

    // Get total count
    const total = await prisma.review.count({ where });

    // Get reviews with pagination
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            slug: true
          }
        }
      },
      orderBy: { [sort_by]: sort_order },
      skip,
      take: limit,
    });

    return {
      data: reviews.map(review => ({
        ...review,
        user: review.user ? {
          ...review.user,
          avatar: getFullUrl(review.user.avatar)
        } : null,
        product: review.product ? {
          ...review.product,
          thumbnail: getFullUrl(review.product.thumbnail)
        } : null
      })),
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const prisma = await this.getTenantPrisma();
    
    const [total, published, hidden, avgRating, ratingBreakdown] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: true } }),
      prisma.review.count({ where: { status: false } }),
      prisma.review.aggregate({
        _avg: { rating: true }
      }),
      prisma.review.groupBy({
        by: ['rating'],
        _count: { rating: true },
        orderBy: { rating: 'asc' }
      })
    ]);

    const recentReviews = await prisma.review.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        },
        product: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Format rating distribution
    const ratings = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    ratingBreakdown.forEach(item => {
      ratings[item.rating] = item._count.rating;
    });

    return {
      total,
      published,
      pending: 0, // Since status is not nullable in schema
      hidden,
      averageRating: avgRating._avg.rating || 0,
      ratingDistribution: ratings,
      recentReviews: recentReviews.map(review => ({
        ...review,
        user: review.user ? {
          ...review.user,
          avatar: getFullUrl(review.user.avatar)
        } : null
      }))
    };
  }

  async findOne(id: string) {
    const prisma = await this.getTenantPrisma();
    
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            createdAt: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            slug: true
          }
        }
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return {
      ...review,
      user: review.user ? {
        ...review.user,
        avatar: getFullUrl(review.user.avatar)
      } : null,
      product: review.product ? {
        ...review.product,
        thumbnail: getFullUrl(review.product.thumbnail)
      } : null
    };
  }

  async updateStatus(id: string, updateStatusDto: UpdateReviewStatusDto) {
    const prisma = await this.getTenantPrisma();
    
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return prisma.review.update({
      where: { id },
      data: {
        status: updateStatusDto.status
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }

  async remove(id: string) {
    const prisma = await this.getTenantPrisma();
    
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return prisma.review.delete({ where: { id } });
  }

  async getProductReviews(productId: string, query: AdminReviewQueryDto) {
    const prisma = await this.getTenantPrisma();
    
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = { product_id: productId };
    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { [sort_by]: sort_order },
      skip,
      take: limit,
    });

    return {
      data: reviews.map(review => ({
        ...review,
        user: review.user ? {
          ...review.user,
          avatar: getFullUrl(review.user.avatar)
        } : null
      })),
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserReviews(userId: string, query: AdminReviewQueryDto) {
    const prisma = await this.getTenantPrisma();
    
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = { user_id: userId };
    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            slug: true
          }
        }
      },
      orderBy: { [sort_by]: sort_order },
      skip,
      take: limit,
    });

    return {
      data: reviews.map(review => ({
        ...review,
        product: review.product ? {
          ...review.product,
          thumbnail: getFullUrl(review.product.thumbnail)
        } : null
      })),
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
