import { Module } from '@nestjs/common';
import { AdminCategoriesController } from './admin-categories.controller';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { AdminCategoriesService } from './admin-categories.service';

@Module({
  controllers: [AdminCategoriesController, CategoriesController],
  providers: [CategoriesService, AdminCategoriesService]
})
export class CategoriesModule {}
