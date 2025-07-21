import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ChallengeService } from './challenge.service';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';

@ApiTags('User - Challenge')
@UseGuards(JwtAuthGuard)  
@ApiBearerAuth()
@Controller('challenge')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @ApiOperation({ summary: 'Lấy danh sách challenge (published)' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tiêu đề hoặc slug' })
  @ApiQuery({ name: 'type', required: false, description: 'Lọc theo type' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'perPage', required: false, description: 'Số lượng mỗi trang' })
  @ApiResponse({ status: 200, description: 'Danh sách challenge (published)' })
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.challengeService.findAll({ search, type, page, perPage });
  }

  @ApiOperation({ summary: 'Lấy chi tiết challenge (published)' })
  @ApiParam({ name: 'id', description: 'ID challenge', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết challenge (published)' })
  // @UseGuards(JwtAuthGuard) // Bỏ comment nếu muốn bảo vệ endpoint này
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengeService.findOne(id);
  }
}
