import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigAppModule } from './configs/config.module';

@Module({
  imports: [PrismaModule, ConfigAppModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
