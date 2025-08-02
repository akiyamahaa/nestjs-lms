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
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChallengeModule } from './catelogs/challenge/challenge.module';
import { ScoresModule } from './scores/scores.module';

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
    CloudinaryModule,
    EnrollmentsModule,
    ReviewsModule,
    ChallengeModule,
    ScoresModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
