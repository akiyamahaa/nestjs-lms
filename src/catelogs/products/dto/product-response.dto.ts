import { ApiProperty } from '@nestjs/swagger';

export class ProductStatsDto {
  @ApiProperty()
  totalModules: number;

  @ApiProperty()
  totalEnrollments: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  totalLessons: number;
}

export class PaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  pages: number;
}

export class AdminProductStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  published: number;

  @ApiProperty()
  draft: number;

  @ApiProperty()
  archived: number;

  @ApiProperty()
  withEnrollments: number;

  @ApiProperty()
  withoutEnrollments: number;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  recentProducts: any[];
}
