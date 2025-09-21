import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AuthModule } from '../identities/auth/auth.module';

@Module({
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  imports: [AuthModule],
})
export class AdminDashboardModule {}
