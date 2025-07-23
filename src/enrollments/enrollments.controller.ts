import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';
import { GetUser } from 'src/identities/auth/decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';

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
  @Get('my')
  async getMyEnrollments(@GetUser('id') userId: string) {
    return this.enrollmentsService.getMyEnrollments(userId);
  }
}