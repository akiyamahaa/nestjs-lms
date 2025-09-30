import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { AdminReviewsService } from './admin-reviews.service';
import { AdminReviewsController } from './admin-reviews.controller';
import { UsersModule } from 'src/identities/users/users.module';
import { AuthModule } from 'src/identities/auth/auth.module';
import { TenantService } from '../common/services/tenant.service';

@Module({
  providers: [ReviewsService, AdminReviewsService, TenantService],
  controllers: [ReviewsController, AdminReviewsController],
  imports: [AuthModule, UsersModule],
})
export class ReviewsModule {}
