import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';
import { GetUser } from 'src/identities/auth/decorators/get-user.decorator';

@ApiTags('Reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Gửi đánh giá khóa học' })
  @ApiParam({ name: 'productId', description: 'ID khóa học', type: String })
  @ApiBody({ schema: { example: { rating: 5, comment: 'Khóa học rất hay!' } } })
  @Post(':productId')
  async createReview(
    @GetUser('sub') userId: string,
    @Param('productId') productId: string,
    @Body() body: { rating: number; comment?: string }
  ) {
    return this.reviewsService.createReview(userId, productId, body.rating, body.comment);
  }

  @ApiOperation({ summary: 'Lấy danh sách đánh giá của khóa học' })
  @Get('product/:productId')
  async getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }
}
