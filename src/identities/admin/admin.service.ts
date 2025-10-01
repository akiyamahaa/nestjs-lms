import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantService } from 'src/common/services/tenant.service';
import { PrismaClient } from 'generated/prisma';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { EditUserDto } from '../users/dto/edit-user.dto';
import { HashingProvider } from '../auth/providers/hashing.provider';

@Injectable()
export class AdminService {
  constructor(
    private readonly tenantService: TenantService,
    private hashingProvider: HashingProvider
  ) {}

  private async getTenantPrisma(): Promise<PrismaClient> {
    return await this.tenantService.getPrismaClient();
  }

  async getAllUsers(role?: string, keyword?: string, page = 1, perPage = 10) {
    const prisma = await this.getTenantPrisma();
    // Ensure page and perPage are positive integers
    page = Math.max(Number(page) || 1, 1);
    perPage = Math.max(Number(perPage) || 10, 1);
    const skip = (page - 1) * perPage;
    const where: any = {};
    if (role) where.role = role;
    if (keyword) {
      where.OR = [
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatar: true,
          role: true,
          age: true,
          grade: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              challengeScore: true
            }
          }
        }
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getUserById(id: string) {
    if (!id) {
      throw new NotFoundException(`Invalid ID: ${id}`);
    }

    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        age: true,
        grade: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            reviews: true,
            challengeScore: true,
            userCourseProgress: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async createUser(dto: CreateUserDto) {
    const prisma = await this.getTenantPrisma();
    const { email, password, fullName, role } = dto;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    // Hash password
    const hashedPassword = await this.hashingProvider.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: role || 'user',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        age: true,
        grade: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return user;
  }

  async editUser(id: string, dto: EditUserDto) {
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        age: true,
        grade: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async deleteUser(id: string) {
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return prisma.user.delete({
      where: { id },
    });
  }

  // Thống kê tổng quan
  async getUserStats() {
    const prisma = await this.getTenantPrisma();
    const [totalUsers, verifiedUsers, adminUsers, studentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { role: 'user' } }),
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return {
      totalUsers,
      verifiedUsers,
      adminUsers,
      studentUsers,
      recentUsers
    };
  }

  // Thay đổi trạng thái xác thực user
  async toggleUserVerification(id: string) {
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return prisma.user.update({
      where: { id },
      data: { 
        isVerified: !user.isVerified,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
        updatedAt: true,
      }
    });
  }

  // Thay đổi role user
  async changeUserRole(id: string, role: string) {
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return prisma.user.update({
      where: { id },
      data: { 
        role,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        updatedAt: true,
      }
    });
  }

  // Lấy lịch sử hoạt động của user
  async getUserActivity(id: string) {
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const [enrollments, reviews, challengeScores, courseProgress] = await Promise.all([
      prisma.enrollment.findMany({
        where: { user_id: id },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              thumbnail: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10
      }),
      prisma.review.findMany({
        where: { user_id: id },
        include: {
          product: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10
      }),
      prisma.challengeScore.findMany({
        where: { user_id: id },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        },
        orderBy: { submitted_at: 'desc' },
        take: 10
      }),
      prisma.userCourseProgress.findMany({
        where: { user_id: id },
        include: {
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { completed_at: 'desc' },
        take: 10
      })
    ]);

    return {
      enrollments,
      reviews,
      challengeScores,
      courseProgress
    };
  }
}
