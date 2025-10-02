import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { TenantService } from 'src/common/services/tenant.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class UserTenantService {
  constructor(
    private tenantService: TenantService,
    private defaultPrisma: PrismaService,
    @Inject(REQUEST) private request: Request,
  ) {}

  async findUserById(userId: string) {
    try {
      // Thử tìm user trong database được chỉ định bởi tenant
      const prisma = await this.tenantService.getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (user) {
        return user;
      }
    } catch (error) {
      console.log('Error finding user in tenant database:', error);
    }

    // Nếu không tìm thấy trong tenant database, thử database mặc định
    try {
      const user = await this.defaultPrisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      console.log('Error finding user in default database:', error);
      return null;
    }
  }
}