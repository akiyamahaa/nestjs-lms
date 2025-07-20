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
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';

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
    const dto = plainToInstance(CreateProductDto, data);
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
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
