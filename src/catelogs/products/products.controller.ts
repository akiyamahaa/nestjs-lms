import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('User - Courses')
@Controller('courses')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Lấy danh sách khóa học (course) cho user' })
  @ApiQuery({ name: 'category_id', required: false, description: 'Lọc theo category' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tiêu đề' })
  @ApiResponse({ status: 200, description: 'Danh sách khóa học' })
  @Get()
  async getCourses(
    @Query('category_id') category_id?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAllForUser({ category_id, search });
  }

  @ApiOperation({ summary: 'Lấy chi tiết khóa học cho user' })
  @ApiParam({ name: 'id', description: 'ID khóa học', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết khóa học' })
  @Get(':id')
  async getCourseDetail(@Param('id') id: string) {
    return this.productsService.findOneForUser(id);
  }
}