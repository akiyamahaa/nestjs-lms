import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    MaxLength,
    ValidateNested
} from 'class-validator';
import { ProductStatus } from '../enum/product-status.enum';
import { ProductLabel } from '../enum/product-label.enum';
import { Type } from 'class-transformer';

class CreateModuleDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    short_description: string;

    @ApiPropertyOptional()
    @IsOptional()
    order?: number;

    @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;
}

export class CreateProductDto {
    @ApiProperty({ maxLength: 255 })
    @IsString()
    @MaxLength(255)
    title: string;

    @ApiProperty({ maxLength: 255 })
    @IsString()
    @MaxLength(255)
    slug: string;

    @ApiProperty()
    @IsString()
    short_description: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsUUID()
    category_id: string;

    @ApiProperty({ type: 'string', format: 'binary' })
    @IsOptional()
    thumbnail: any;

    @ApiPropertyOptional({ enum: ProductLabel, default: ProductLabel.NEW })
    @IsEnum(ProductLabel)
    @IsOptional()
    label?: ProductLabel;

    @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;

    @ApiProperty()
    @IsString()
    requirements: string;

    @ApiProperty()
    @IsString()
    learning_outcomes: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    preview_video?: string;

    @ApiProperty({ type: [CreateModuleDto], required: false })
    @IsOptional()
    modules?: any;
}

