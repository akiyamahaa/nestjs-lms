import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { AuthModule } from '../auth/auth.module';
import { UserController } from './users.controller';
@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports: [forwardRef(() => AuthModule)],
  controllers: [UserController],
})
export class UsersModule {}
