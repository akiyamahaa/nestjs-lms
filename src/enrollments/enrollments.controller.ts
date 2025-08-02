import { Controller, Post, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';
import { GetUser } from 'src/identities/auth/decorators/get-user.decorator';

@ApiTags('Enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: 'Đăng ký khóa học' })
  @ApiParam({ name: 'courseId', description: 'ID khóa học', type: String })
  @Post(':courseId')
  async enroll(@GetUser('id') userId: string, @Param('courseId') courseId: string) {
    return this.enrollmentsService.enroll(userId, courseId);
  }

  @ApiOperation({ summary: 'Lấy danh sách khóa học đã đăng ký' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Lọc theo trạng thái: all (tất cả), learning (đang học), completed (đã hoàn thành)',
    enum: ['all', 'learning', 'completed']
  })
  @Get('my')
  async getMyEnrollments(
    @GetUser('id') userId: string,
    @Query('status') status?: string
  ) {
    return this.enrollmentsService.getMyEnrollments(userId, status);
  }
}