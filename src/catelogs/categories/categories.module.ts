import { Module } from '@nestjs/common';
import { AdminCategoriesController } from './admin-categories.controller';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { AdminCategoriesService } from './admin-categories.service';
import { AuthModule } from '../../identities/auth/auth.module';
import { UsersModule } from 'src/identities/users/users.module';
@Module({
  controllers: [AdminCategoriesController, CategoriesController],
  providers: [CategoriesService, AdminCategoriesService],
  imports: [AuthModule, UsersModule],
})
export class CategoriesModule {}
