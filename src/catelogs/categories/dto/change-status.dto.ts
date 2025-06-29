import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '../enums/category-status.enum';
import { IsEnum } from 'class-validator';

export class ChangeStatusDto {
  @ApiProperty({ enum: CategoryStatus, example: CategoryStatus.PUBLISHED })
  @IsEnum(CategoryStatus)
  status: CategoryStatus;
}