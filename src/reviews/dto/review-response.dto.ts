import { ApiProperty } from '@nestjs/swagger';

export class ReviewStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  approved: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  rejected: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty({ 
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Distribution of ratings from 1-5 stars'
  })
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  @ApiProperty({ 
    type: 'array', 
    items: { 
      type: 'object',
      additionalProperties: true
    },
    description: 'Recent reviews with user and product information'
  })
  recentReviews: any[];
}

export class ReviewPaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  pages: number;
}
