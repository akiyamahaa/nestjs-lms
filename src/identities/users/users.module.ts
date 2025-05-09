import { Module } from '@nestjs/common';
import { UsersService } from './providers/users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports: [],
  // controllers: [UsersController],
})
export class UsersModule {}
