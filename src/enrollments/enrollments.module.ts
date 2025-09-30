import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { TenantService } from '../common/services/tenant.service';
import { AuthModule } from 'src/identities/auth/auth.module';
import { UsersModule } from 'src/identities/users/users.module';

@Module({
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, TenantService],
  exports: [EnrollmentsService],
  imports: [AuthModule, UsersModule],
})
export class EnrollmentsModule {}