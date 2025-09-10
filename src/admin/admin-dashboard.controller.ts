import {
  Controller,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardStatsResponseDto } from './dto/dashboard-response.dto';
import { GetUser } from '../identities/auth/decorators/get-user.decorator';

interface IActiveUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @ApiOperation({
    summary: 'Lấy thống kê tổng quan cho dashboard admin',
    description: 'Hiển thị các chỉ số: Tổng khóa học, Tình trạng học, Doanh thu mới, Đánh giá'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Thống kê dashboard',
    type: DashboardStatsResponseDto
  })
  @Get('stats')
  getDashboardStats(@GetUser() user: IActiveUser) {
    return this.adminDashboardService.getDashboardStats();
  }

  @ApiOperation({
    summary: 'Lấy danh sách top 5 user theo tổng điểm',
    description: 'Hiển thị bảng xếp hạng top users có điểm cao nhất từ challenges và lessons'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách top users theo điểm',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rank: { type: 'number', example: 1 },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string', example: 'Israel Becker' },
              avatar: { type: 'string', nullable: true },
              email: { type: 'string' }
            }
          },
          totalScore: { type: 'number', example: 7924 },
          formattedScore: { type: 'string', example: '7,924' }
        }
      }
    }
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng top users (default: 5)' })
  @Get('top-users')
  getTopUsersByScore(
    @GetUser() user: IActiveUser,
    @Query('limit') limit?: number
  ) {
    return this.adminDashboardService.getTopUsersByScore(limit ? +limit : 5);
  }
}
