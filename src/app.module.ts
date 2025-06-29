import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigAppModule } from './configs/config-app.module';
import { AuthModule } from './identities/auth/auth.module';
import { UsersModule } from './identities/users/users.module';
import { AdminModule } from './identities/admin/admin.module';
import { CategoriesModule } from './catelogs/categories/categories.module';

@Module({
  imports: [
    PrismaModule,
    ConfigAppModule,
    AuthModule,
    UsersModule,
    AdminModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
