import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from 'generated/prisma';
import { EConfigKeys } from 'src/common/types/config-keys';
import { TenantPrismaService } from './tenant-prisma.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService, private tenantPrismaService: TenantPrismaService) {
    super({
      datasources: {
        db: {
          url: config.get<string>(`${EConfigKeys.AppConfig}.DatabaseUrl`),
        },
      },
    });
  }
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

  // Get tenant-specific Prisma client
  async getTenantClient(databaseUrl: string): Promise<PrismaClient> {
    return this.tenantPrismaService.getClient(databaseUrl);
  }
}
