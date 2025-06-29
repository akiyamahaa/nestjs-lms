import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Get,
  Patch
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AdminCategoriesService } from './admin-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { CategoryStatus } from './enums/category-status.enum';
import { ChangeStatusDto } from './dto/change-status.dto';

@ApiTags('Admin - Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly adminCategoriesService: AdminCategoriesService) { }

  @ApiOperation({ summary: 'Lấy tất cả danh mục' })
  @ApiResponse({ status: 200, description: 'Danh sách danh mục' })
  @Get()
  findAll() {
    return this.adminCategoriesService.findAll();
  }

  @ApiOperation({ summary: 'Tạo mới danh mục' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @Post()
  create(@Body() data: CreateCategoryDto) {
    return this.adminCategoriesService.create(data);
  }

  @ApiOperation({ summary: 'Lấy chi tiết danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết danh mục' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminCategoriesService.findOne(id);
  }

  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục', type: String })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<CreateCategoryDto>) {
    console.log('Updating category with ID:', id, 'and data:', data);
    return this.adminCategoriesService.update(id, data);
  }

  @ApiOperation({ summary: 'Xóa mềm danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục', type: String })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminCategoriesService.remove(id);
  }

  @ApiOperation({ summary: 'Đổi trạng thái danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục', type: String })
  @ApiBody({ type: ChangeStatusDto })
  @ApiResponse({ status: 200, description: 'Đổi trạng thái thành công' })
  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeStatusDto
  ) {
    return this.adminCategoriesService.changeStatus(id, body.status);
  }
}
