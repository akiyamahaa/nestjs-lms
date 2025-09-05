import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AdminChallengeService } from './admin-challenge.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';

@ApiTags('Admin - Challenge')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('admin/challenge')
export class AdminChallengeController {
  constructor(private readonly challengeService: AdminChallengeService) {}

  @ApiOperation({ summary: 'Lấy danh sách challenge' })
  @ApiResponse({ status: 200, description: 'Danh sách challenge' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tiêu đề hoặc slug' })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo status' })
  @ApiQuery({ name: 'type', required: false, description: 'Lọc theo type' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'perPage', required: false, description: 'Số lượng mỗi trang' })
  @Get('index')
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.challengeService.findAll({ search, status, type, page, perPage });
  }

  @ApiOperation({ summary: 'Lấy chi tiết challenge' })
  @ApiParam({ name: 'id', description: 'ID challenge', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết challenge' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengeService.findOne(id);
  }

  @ApiOperation({ summary: 'Tạo mới challenge' })
  @ApiBody({ description: 'Dữ liệu challenge', type: CreateChallengeDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @Post()
  create(@Body() dto: CreateChallengeDto) {
    return this.challengeService.create(dto);
  }

  @ApiOperation({ summary: 'Cập nhật challenge' })
  @ApiParam({ name: 'id', description: 'ID challenge', type: String })
  @ApiBody({ description: 'Dữ liệu cập nhật', type: CreateChallengeDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateChallengeDto) {
    return this.challengeService.update(id, dto);
  }

  @ApiOperation({ summary: 'Xóa challenge' })
  @ApiParam({ name: 'id', description: 'ID challenge', type: String })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.challengeService.remove(id);
  }
}
