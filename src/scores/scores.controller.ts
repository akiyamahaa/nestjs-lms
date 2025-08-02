import { Controller, Get, Param, UseGuards, Query, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ScoresService } from './scores.service';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';
import { GetUser } from 'src/identities/auth/decorators/get-user.decorator';

// Decorator @Public để đánh dấu endpoint public
export const Public = () => SetMetadata('isPublic', true);

@ApiTags('Scores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @ApiOperation({ summary: 'Lấy điểm chi tiết của user hiện tại (tổng + lesson + challenge theo từng loại)' })
  @Get('my-score')
  async getMyScore(@GetUser('id') userId: string) {
    return this.scoresService.getUserDetailedScore(userId);
  }

  @ApiOperation({ summary: 'Lấy bảng xếp hạng tổng điểm' })
  @ApiQuery({ name: 'limit', description: 'Số lượng user trong bảng xếp hạng', type: Number, required: false })
  @ApiQuery({ name: 'grade', description: 'Lọc theo lớp học (G1-G12)', type: String, required: false })
  @Public()
  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit') limit?: number,
    @Query('grade') grade?: string
  ) {
    return this.scoresService.getLeaderboard(limit ? Number(limit) : 10, grade);
  }

  @ApiOperation({ summary: 'Lấy thứ hạng của user hiện tại' })
  @Get('my-rank')
  async getMyRank(@GetUser('id') userId: string) {
    return this.scoresService.getUserRank(userId);
  }
}
