import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { EditUserDto } from '../users/dto/edit-user.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(role?: string, keyword?: string, page = 1, perPage = 10) {
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
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getUserById(id: number) {
    if (isNaN(id)) {
      throw new NotFoundException(`Invalid ID: ${id}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async createUser(dto: CreateUserDto) {
    const { email, password, fullName, role } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new NotFoundException(`User with email ${email} already exists`);
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        password,
        fullName,
        role,
      },
    });

    return user;
  }

  async editUser(id: number, dto: EditUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
