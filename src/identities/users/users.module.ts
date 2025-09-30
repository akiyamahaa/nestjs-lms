import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { AuthModule } from '../auth/auth.module';
import { UserController } from './users.controller';
import { TenantService } from '../../common/services/tenant.service';
@Module({
  providers: [UsersService, TenantService],
  exports: [UsersService],
  imports: [forwardRef(() => AuthModule)],
  controllers: [UserController],
})
export class UsersModule {}
