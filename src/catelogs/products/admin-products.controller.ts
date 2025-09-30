import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiConsumes, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AdminProductsService } from './admin-products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminProductQueryDto } from './dto/admin-product-query.dto';
import { AdminProductStatsResponseDto } from './dto/product-response.dto';
import { storage } from 'src/cloudinary/cloudinary.storage';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { diskStorage } from 'multer';

@ApiTags('Admin - Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly productsService: AdminProductsService,
    private readonly productsImportService: ProductsService
  ) { }

  @ApiOperation({ 
    summary: 'Lấy danh sách sản phẩm với phân trang và tìm kiếm',
    description: 'Lấy danh sách sản phẩm với filter, search và phân trang'
  })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  @Get()
  findAll(@Query() query: AdminProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @ApiOperation({ summary: 'Lấy thống kê sản phẩm' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thống kê sản phẩm',
    type: AdminProductStatsResponseDto
  })
  @Get('stats')
  getStats() {
    return this.productsService.getStats();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới sản phẩm' })
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
    @Body() data: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    // Parse modules nếu là string
    if (typeof data.modules === 'string') {
      const modulesStr = data.modules as string;
      if (modulesStr.trim() === '' || modulesStr === 'null') {
        data.modules = [];
      } else {
        try {
          data.modules = JSON.parse(modulesStr);
        } catch {
          throw new BadRequestException('modules must be a valid JSON array string (parse error)');
        }
      }
    }
    // ...parse các trường lồng nhau khác nếu cần...

    // Convert về instance của DTO và validate
    const dto = plainToInstance(CreateProductDto, data);
    await validateOrReject(dto);

    // Log để kiểm tra
    console.log('data:', dto);

    const thumbnailPath = file ? file.path : undefined;
    return this.productsService.create({
      ...dto,
      thumbnail: thumbnailPath,
      modules: dto.modules,
    });
  }

  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm', type: String })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProductDto })
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
    @Body() data: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    // Parse modules nếu là string
    if (typeof data.modules === 'string') {
      const modulesStr = data.modules as string;
      if (modulesStr.trim() === '' || modulesStr === 'null') {
        data.modules = [];
      } else {
        try {
          data.modules = JSON.parse(modulesStr);
        } catch {
          throw new BadRequestException('modules must be a valid JSON array string (parse error)');
        }
      }
    }
    if (data.modules === undefined || data.modules === null) {
      data.modules = [];
    }
    if (data.modules && !Array.isArray(data.modules)) {
      throw new BadRequestException('modules must be an array');
    }
    // Kiểm tra từng phần tử phải là object
    if (Array.isArray(data.modules)) {
      const invalid = data.modules.some(
        (m) => typeof m !== 'object' || m === null || Array.isArray(m)
      );
      if (invalid) {
        throw new BadRequestException('each value in modules must be a non-null object');
      }
    }

    // Parse tiếp các trường lồng nhau nếu cần (lessons, quiz_questions)
    if (data.modules) {
      data.modules = data.modules.map((module: any) => {
        if (typeof module.lessons === 'string') {
          try {
            module.lessons = JSON.parse(module.lessons);
          } catch {
            throw new BadRequestException('lessons must be a valid JSON array');
          }
        }
        if (module.lessons) {
          module.lessons = module.lessons.map((lesson: any) => {
            if (typeof lesson.quiz_questions === 'string') {
              try {
                lesson.quiz_questions = JSON.parse(lesson.quiz_questions);
              } catch {
                throw new BadRequestException('quiz_questions must be a valid JSON array');
              }
            }
            return lesson;
          });
        }
        return module;
      });
    }

    // Convert về instance của DTO và validate
    const dto = plainToInstance(UpdateProductDto, data);
    await validateOrReject(dto);

    const thumbnailPath = file ? file.path : undefined;
    return this.productsService.update(id, {
      ...dto,
      ...(thumbnailPath && { thumbnail: thumbnailPath }),
      modules: dto.modules,
    });
  }

  @ApiOperation({ summary: 'Xóa mềm sản phẩm' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm', type: String })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @ApiOperation({ 
    summary: 'Import products từ file JSON',
    description: 'Upload file JSON để import products, modules, lessons và quiz questions'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File JSON chứa dữ liệu products'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Import thành công',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Số lượng products đã import' },
        message: { type: 'string', description: 'Thông báo kết quả' }
      }
    }
  })
  @Post('import')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/temp',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `products-${uniqueSuffix}.json`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/json') {
        return cb(new BadRequestException('Only JSON files are allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    }
  }))
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.productsImportService.importProductsFromJson(file.path);
      
      // Xóa file tạm sau khi import xong
      const fs = require('fs');
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return result;
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      const fs = require('fs');
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      throw new BadRequestException(`Import failed: ${error.message}`);
    }
  }
}
