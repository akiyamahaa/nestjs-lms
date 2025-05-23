import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

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
  public getMe(@GetUser('id') userId: number) {
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
}
