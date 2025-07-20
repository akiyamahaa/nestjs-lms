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
    ValidateNested,
    IsArray
} from 'class-validator';
import { Type } from 'class-transformer';
// import { ProductStatus } from '../enum/product-status.enum';
// import { ProductLabel } from '../enum/product-label.enum';
import { LessonType } from 'generated/prisma';
import { LessonStatus } from 'generated/prisma';
import { ProductStatus } from 'generated/prisma';
import { ProductLabel } from 'generated/prisma';

class CreateQuizQuestionDto {
    @ApiProperty()
    @IsString()
    question: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    answers: string[];

    @ApiProperty()
    @IsString()
    correct_answer: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    explanation?: string;
}

class CreateLessonDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: LessonType })
    @IsEnum(LessonType)
    type: string;

    @ApiPropertyOptional()
    @IsOptional()
    is_previewable?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    order?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    attachment?: string;

    @ApiPropertyOptional({ enum: LessonStatus })
    @IsEnum(LessonStatus)
    @IsOptional()
    status?: string;

    @ApiPropertyOptional({ type: [CreateQuizQuestionDto] })
    @ValidateNested({ each: true })
    @Type(() => CreateQuizQuestionDto)
    @IsOptional()
    quiz_questions?: CreateQuizQuestionDto[];
}

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

    @ApiPropertyOptional({ enum: ProductStatus, default: 'draft' })
    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;

    @ApiPropertyOptional({ type: [CreateLessonDto] })
    @ValidateNested({ each: true })
    @Type(() => CreateLessonDto)
    @IsOptional()
    lessons?: CreateLessonDto[];
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

    @ApiPropertyOptional({ enum: ProductLabel, default: 'new' })
    @IsEnum(ProductLabel)
    @IsOptional()
    label?: ProductLabel;

    @ApiPropertyOptional({ enum: ProductStatus, default: 'draft' })
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
    @ValidateNested({ each: true })
    @Type(() => CreateModuleDto)
    modules?: CreateModuleDto[];
}

