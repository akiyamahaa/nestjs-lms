import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AdminProductsService } from './admin-products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { storage } from 'src/cloudinary/cloudinary.storage';

@ApiTags('Products')
@Controller('products')
export class AdminProductsController {
  constructor(private readonly productsService: AdminProductsService) { }

  @ApiOperation({ summary: 'Lấy tất cả sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới sản phẩm (có upload ảnh)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateProductDto,
  })
  @UseInterceptors(FileInterceptor('thumbnail', {
    storage,
    limits: {
      fieldSize: 20 * 1024 * 1024,
    }
  }))
  async create(
    @Body() data: CreateProductDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    console.log('typeof modules:', typeof data.modules, data.modules);
    let modules = data.modules;
    if (typeof modules === 'string') {
      try {
        modules = JSON.parse(modules);
      } catch {
        throw new BadRequestException('modules must be a valid JSON array');
      }
    }
    if (modules && !Array.isArray(modules)) {
      throw new BadRequestException('modules must be an array');
    }
    // Optionally: validate each module object here if needed

    const thumbnailPath = file ? file.path : undefined;
    return this.productsService.create({
      ...data,
      thumbnail: thumbnailPath,
      modules,
    });
  }

  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: 'Cập nhật sản phẩm ' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @Put(':id')
  @UseInterceptors(FileInterceptor('thumbnail', {
    storage,
    limits: {
      fieldSize: 20 * 1024 * 1024,
    }
  }))
  async update(
    @Param('id') id: string,
    @Body() data: Partial<CreateProductDto>,
    @UploadedFile() file: Express.Multer.File
  ) {
    let modules = data.modules;
    if (typeof modules === 'string') {
      try {
        modules = JSON.parse(modules);
      } catch {
        throw new BadRequestException('modules must be a valid JSON array');
      }
    }
    if (modules && !Array.isArray(modules)) {
      throw new BadRequestException('modules must be an array');
    }
    const thumbnailPath = file ? file.path : undefined;
    return this.productsService.update(id, {
      ...data,
      ...(thumbnailPath && { thumbnail: thumbnailPath }),
      modules,
    });
  }

  @ApiOperation({ summary: 'Xóa mềm sản phẩm' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm', type: String })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
