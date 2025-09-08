import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminReviewsService } from './admin-reviews.service';
import { AdminReviewQueryDto } from './dto/admin-review-query.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ReviewStatsDto } from './dto/review-response.dto';
import { isUUID } from 'class-validator';

@ApiTags('Admin - Reviews')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @ApiOperation({
    summary: 'Lấy danh sách đánh giá với phân trang và tìm kiếm',
    description: 'Lấy danh sách đánh giá với filter, search và phân trang cho admin'
  })
  @ApiResponse({ status: 200, description: 'Danh sách đánh giá' })
  @Get()
  findAll(@Query() query: AdminReviewQueryDto) {
    return this.adminReviewsService.findAll(query);
  }

  @ApiOperation({ summary: 'Lấy chi tiết đánh giá' })
  @ApiParam({ name: 'id', description: 'ID đánh giá', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết đánh giá' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format: ' + id);
    }
    return this.adminReviewsService.findOne(id);
  }

  @ApiOperation({ summary: 'Xóa đánh giá' })
  @ApiParam({ name: 'id', description: 'ID đánh giá', type: String })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid UUID format: ' + id);
    }
    return this.adminReviewsService.remove(id);
  }
}
