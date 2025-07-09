import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { UsersService } from './providers/users.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { EditUserDto } from './dto/edit-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from 'src/cloudinary/cloudinary.storage';

@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private userService: UsersService) {}

  /**
   * Create a new user.
   */
  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        status: 'success',
        message: 'User created successfully',
        data: {
          id: 'uuid',
          fullName: 'quanganh',
          email: 'quanganh@example.com',
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  public createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Patch()
  @ApiOperation({ summary: 'Edit user' })
  editUser(@GetUser('sub') userId: number, @Body() dto: EditUserDto) {
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }
    return this.userService.editUser(userId, dto);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  changePassword(
    @GetUser('sub') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }
    return this.userService.changePassword(userId, dto);
  }

  /**
   * Get a user by ID.
   * @param id - UUID of the user
   */
  @Get('me')
  @ApiOperation({ summary: 'Get user profile by Id' })
  @ApiParam({ name: 'id', type: 'number', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user',
    schema: {
      example: {
        id: 'uuid',
        email: 'quanganh@example.com',
        fullName: 'quanganh',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  public getMe(@GetUser('sub') userId: number) {
    return this.userService.findOneById(userId);
  }

  /**
   * Get a user by ID.
   * @param id - UUID of the user
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user',
    schema: {
      example: {
        id: 'uuid',
        email: 'quanganh@example.com',
        fullName: 'quanganh',
      },
    },
  })
  public getUserById(@Param('id') id: number) {
    return this.userService.findOneById(id);
  }

  /**
   * Upload avatar for the user.
   * @param userId - ID of the user
   * @param file - Uploaded file
   */
  @Post('upload-avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @UseInterceptors(FileInterceptor('file', { storage }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar file upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User avatar uploaded successfully',
    schema: {
      example: {
        status: 'success',
        message: 'User avatar uploaded successfully',
        data: {
          id: 'uuid',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    },
  })
  async uploadAvatar(
    @GetUser('sub') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }
    if (!file) {
      throw new ForbiddenException('No file uploaded');
    }
    console.log('Uploading avatar for user ID:', userId);
    return await this.userService.uploadAvatar(userId, file);
  }
}
