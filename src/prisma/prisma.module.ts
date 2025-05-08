import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Để dùng được toàn app, không cần import nhiều lần
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
