import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AdminChallengeService } from './admin-challenge.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { JwtAuthGuard } from 'src/identities/auth/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';

@ApiTags('Admin - Challenge')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('admin/challenge')
export class AdminChallengeController {
  constructor(private readonly challengeService: AdminChallengeService) {}

  @ApiOperation({ 
    summary: 'Lấy danh sách challenge',
    description: 'Lấy danh sách challenge với filter, search và phân trang. Bao gồm thông tin summary và thống kê cho từng challenge.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách challenge với thông tin summary',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              slug: { type: 'string' },
              type: { type: 'string', enum: ['quiz', 'puzzle', 'ordering', 'fillBlank'] },
              status: { type: 'string', enum: ['draft', 'published', 'archived'] },
              summary: {
                type: 'object',
                properties: {
                  questionsCount: { type: 'number' },
                  itemsCount: { type: 'number' },
                  hasData: { type: 'boolean' },
                  preview: { type: 'string' }
                }
              },
              stats: {
                type: 'object',
                properties: {
                  totalCompletions: { type: 'number' }
                }
              }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        perPage: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
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

  @ApiOperation({ 
    summary: 'Lấy chi tiết challenge',
    description: 'Lấy chi tiết đầy đủ của challenge bao gồm tất cả questions, answers, và data theo từng loại challenge.'
  })
  @ApiParam({ name: 'id', description: 'ID challenge', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Chi tiết challenge với đầy đủ relationships',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['quiz', 'puzzle', 'ordering', 'fillBlank'] },
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        order: { type: 'number' },
        data: {
          oneOf: [
            {
              type: 'object',
              description: 'Quiz data',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      question: { type: 'string' },
                      explanation: { type: 'string' },
                      answers: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            answer: { type: 'string' },
                            is_correct: { type: 'boolean' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            {
              type: 'object',
              description: 'Puzzle data',
              properties: {
                instruction: { type: 'string' },
                image: { type: 'string' }
              }
            }
          ]
        },
        stats: {
          type: 'object',
          properties: {
            totalCompletions: { type: 'number' }
          }
        }
      }
    }
  })
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
  @ApiBody({ description: 'Dữ liệu cập nhật', type: UpdateChallengeDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChallengeDto) {
    return this.challengeService.update(id, dto);
  }

  @ApiOperation({ summary: 'Xóa challenge' })
  @ApiParam({ name: 'id', description: 'ID challenge', type: String })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.challengeService.remove(id);
  }
}
