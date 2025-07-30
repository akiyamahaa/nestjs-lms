import { Controller, Get, Param, Query, Post, UseGuards, Body } from '@nestjs/common';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { GetUser } from 'src/identities/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';

@ApiTags('User - Courses')
@ApiBearerAuth()
@Controller('courses')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Lấy danh sách khóa học (course) cho user' })
  @ApiQuery({ name: 'category_id', required: false, description: 'Lọc theo category' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tiêu đề' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang' })
  @ApiQuery({ name: 'perPage', required: false, description: 'Số lượng khóa học trên mỗi trang' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sắp xếp: newest (mới nhất), popular (phổ biến nhất)' })
  @ApiResponse({ status: 200, description: 'Danh sách khóa học' })
  @Get()
  async getCourses(
    @Query('category_id') category_id?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('sort') sort?: string,
  ) {
    return this.productsService.findAllForUser({ category_id, search, page, perPage, sort });
  }

  @ApiOperation({ summary: 'Lấy chi tiết khóa học cho user' })
  @ApiParam({ name: 'id', description: 'ID khóa học', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết khóa học' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getCourseDetail(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.productsService.findOneForUser(id, userId);
  }

  @ApiOperation({ summary: 'Lấy chi tiết bài học (lesson) cho user' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết bài học' })
  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId')
  async getLessonDetail(@Param('lessonId') lessonId: string, @GetUser('id') userId: string) {
    return this.productsService.findLessonDetailForUser(lessonId, userId);
  }

  @ApiOperation({ summary: 'Cập nhật user đã học lesson nào' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học', type: String })
  @UseGuards(JwtAuthGuard)
  @Post('lesson/:lessonId/progress')
  async updateLessonProgress(@GetUser('id') userId: string, @Param('lessonId') lessonId: string) {
    return this.productsService.updateLessonProgress(userId, lessonId);
  }

  @ApiOperation({ summary: 'Trả lời câu hỏi trắc nghiệm, tính điểm và lưu điểm' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học', type: String })
  @ApiBody({ type: SubmitQuizDto })
  @UseGuards(JwtAuthGuard)
  @Post('lesson/:lessonId/quiz')
  async submitQuiz(
    @GetUser('id') userId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: SubmitQuizDto
  ) {
    console.log('Submitting quiz for user:', userId, 'lesson:', lessonId, 'answers:', body.answers);
    return this.productsService.submitQuiz(userId, lessonId, body.answers);
  }
}