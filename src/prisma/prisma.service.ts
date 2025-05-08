import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Optional: dọn dẹp dữ liệu khi test (clean architecture)
  cleanDb() {
    return this.$transaction([
      // Thêm các bảng khác nếu cần
    ]);
  }
}
