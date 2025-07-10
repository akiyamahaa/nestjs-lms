import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('User - Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Lấy tất cả danh mục' })
  @ApiResponse({ status: 200, description: 'Danh sách danh mục' })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({ summary: 'Lấy chi tiết danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết danh mục' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }
}