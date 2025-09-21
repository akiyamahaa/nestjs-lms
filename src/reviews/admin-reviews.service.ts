import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminReviewQueryDto } from './dto/admin-review-query.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { Prisma } from 'generated/prisma';
import { getFullUrl } from '../common/helpers/helper';

@Injectable()
export class AdminReviewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AdminReviewQueryDto) {
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
    const total = await this.prisma.review.count({ where });

    // Get reviews with pagination
    const reviews = await this.prisma.review.findMany({
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
    const [
      total,
      approved,
      rejected,
      averageRating,
      ratingDistribution
    ] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.review.count({ where: { status: true } }),
      this.prisma.review.count({ where: { status: false } }),
      this.prisma.review.aggregate({
        _avg: { rating: true }
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        _count: { rating: true },
        orderBy: { rating: 'asc' }
      })
    ]);

    const recentReviews = await this.prisma.review.findMany({
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
    ratingDistribution.forEach(item => {
      ratings[item.rating] = item._count.rating;
    });

    return {
      total,
      approved,
      pending: 0, // Since status is not nullable in schema
      rejected,
      averageRating: averageRating._avg.rating || 0,
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
    const review = await this.prisma.review.findUnique({
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
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
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
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.delete({ where: { id } });
  }

  async getProductReviews(productId: string, query: AdminReviewQueryDto) {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = { product_id: productId };
    const total = await this.prisma.review.count({ where });

    const reviews = await this.prisma.review.findMany({
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
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = { user_id: userId };
    const total = await this.prisma.review.count({ where });

    const reviews = await this.prisma.review.findMany({
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
