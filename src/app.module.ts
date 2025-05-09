import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigAppModule } from './configs/config-app.module';
import { AuthModule } from './identities/auth/auth.module';
import { UsersModule } from './identities/users/users.module';

@Module({
  imports: [PrismaModule, ConfigAppModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
