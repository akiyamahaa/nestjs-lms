import { ApiProperty } from '@nestjs/swagger';

export class StatItemDto {
  @ApiProperty({ description: 'Giá trị thống kê' })
  value: number;

  @ApiProperty({ description: 'Tỷ lệ tăng trưởng (%)', required: false })
  growth?: number;

  @ApiProperty({ description: 'Nhãn hiển thị' })
  label: string;

  @ApiProperty({ description: 'Giá trị đã format (cho doanh thu)', required: false })
  formatted?: string;

  @ApiProperty({ description: 'Rating trung bình (cho đánh giá)', required: false })
  avgRating?: number;
}

export class OverviewStatsDto {
  @ApiProperty({ type: StatItemDto })
  totalCourses: StatItemDto;

  @ApiProperty({ type: StatItemDto })
  totalUsers: StatItemDto;

  @ApiProperty({ type: StatItemDto })
  newEnrollmentsToday: StatItemDto;

  @ApiProperty({ type: StatItemDto })
  totalEnrollments: StatItemDto;

  @ApiProperty({ type: StatItemDto })
  estimatedRevenue: StatItemDto;

  @ApiProperty({ type: StatItemDto })
  totalReviews: StatItemDto;
}

export class CoursesStatsDto {
  @ApiProperty()
  published: number;

  @ApiProperty()
  draft: number;

  @ApiProperty()
  archived: number;
}

export class RecentActivityDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  recentEnrollments: any[];
}

export class DashboardDetailsDto {
  @ApiProperty({ type: CoursesStatsDto })
  coursesStats: CoursesStatsDto;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  recentEnrollments: any[];

  @ApiProperty({ 
    type: 'array', 
    items: { type: 'object' },
    description: 'Top khóa học được đánh giá cao'
  })
  topRatedCourses: any[];
}

export class DashboardStatsResponseDto {
  @ApiProperty({ type: OverviewStatsDto })
  overview: OverviewStatsDto;

  @ApiProperty({ type: DashboardDetailsDto })
  details: DashboardDetailsDto;
}

export class UsersStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  newThisWeek: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  inactive: number;

  @ApiProperty({ 
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Thống kê theo grade'
  })
  byGrade: Record<string, number>;
}

export class RevenueStatsResponseDto {
  @ApiProperty({ 
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Doanh thu theo tháng'
  })
  monthlyRevenue: Record<string, number>;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  avgMonthlyRevenue: number;
}

export class LeaderboardUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  avatar: string | null;

  @ApiProperty()
  totalScore: number;

  @ApiProperty()
  challengeScore: number;

  @ApiProperty()
  lessonScore: number;
}
