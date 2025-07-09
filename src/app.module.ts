import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigAppModule } from './configs/config-app.module';
import { AuthModule } from './identities/auth/auth.module';
import { UsersModule } from './identities/users/users.module';
import { AdminModule } from './identities/admin/admin.module';
import { CategoriesModule } from './catelogs/categories/categories.module';
import { ProductsModule } from './catelogs/products/products.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    ConfigAppModule,
    AuthModule,
    UsersModule,
    AdminModule,
    CategoriesModule,
    ProductsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CloudinaryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
