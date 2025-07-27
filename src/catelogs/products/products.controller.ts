import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { GetUser } from 'src/identities/auth/decorators/get-user.decorator';

@ApiTags('User - Courses')
@Controller('courses')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Lấy danh sách khóa học (course) cho user' })
  @ApiQuery({ name: 'category_id', required: false, description: 'Lọc theo category' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tiêu đề' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang' })
  @ApiQuery({ name: 'perPage', required: false, description: 'Số lượng khóa học trên mỗi trang' })
  @ApiResponse({ status: 200, description: 'Danh sách khóa học' })
  @Get()
  async getCourses(
    @Query('category_id') category_id?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.productsService.findAllForUser({ category_id, search, page, perPage });
  }

  @ApiOperation({ summary: 'Lấy chi tiết khóa học cho user' })
  @ApiParam({ name: 'id', description: 'ID khóa học', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết khóa học' })
  @Get(':id')
  async getCourseDetail(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.productsService.findOneForUser(id, userId);
  }

  @ApiOperation({ summary: 'Lấy chi tiết bài học (lesson) cho user' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết bài học' })
  @Get('lesson/:lessonId')
  async getLessonDetail(@Param('lessonId') lessonId: string) {
    return this.productsService.findLessonDetailForUser(lessonId);
  }
}