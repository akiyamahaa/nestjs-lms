import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminService } from './admin.service';
import { EditUserDto } from '../users/dto/edit-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly AdminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Admin get all users' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async getAllUsers(
    @Query('role') role?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.AdminService.getAllUsers(role, keyword, page, perPage);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.AdminService.getUserById(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Admin create user' })
  async createUser(@Body() dto: CreateUserDto) {
    return this.AdminService.createUser(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin edit user' })
  async editUser(@Param('id') id: string, @Body() dto: EditUserDto) {
    return this.AdminService.editUser(Number(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.AdminService.deleteUser(Number(id));
  }
}
