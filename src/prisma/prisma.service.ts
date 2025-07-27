import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from 'generated/prisma';
import { EConfigKeys } from 'src/common/types/config-keys';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
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
}
