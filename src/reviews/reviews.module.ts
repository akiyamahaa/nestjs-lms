import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { UsersModule } from 'src/identities/users/users.module';
import { AuthModule } from 'src/identities/auth/auth.module';

@Module({
  providers: [ReviewsService],
  controllers: [ReviewsController],
  imports: [AuthModule, UsersModule],
})
export class ReviewsModule {}
