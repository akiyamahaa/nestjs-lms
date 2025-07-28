import { Controller, Get, Param, Query, UseGuards, Post, Body, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ChallengeService } from './challenge.service';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';
import { GetUser } from 'src/identities/auth/decorators/get-user.decorator';
import { string } from 'joi';

export const Public = () => SetMetadata('isPublic', true);

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
  @Public()
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
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string
  ) {
    return this.challengeService.findOne(id, userId);
  }
  @ApiOperation({ summary: 'Cập nhật tiến trình/chấm điểm challenge cho user' })
  @ApiParam({ name: 'id', description: 'ID challenge', type: String })
  @ApiResponse({ status: 200, description: 'Cập nhật tiến trình/chấm điểm thành công' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiBearerAuth()
  @Post(':id/progress')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        score: {
          type: 'number',
          example: 85,
          description: 'Điểm số của user cho challenge này',
        },
      },
      required: ['score'],
    },
  })
  async updateChallengeProgress(
    @Param('id') challengeId: string,
    @Body('score') score: number,
    @GetUser('id') userId: string
  ) {
    return this.challengeService.updateChallengeProgress(userId, challengeId, score);
  }
}
