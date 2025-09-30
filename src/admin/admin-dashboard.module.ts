import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { TenantService } from '../common/services/tenant.service';

@Module({
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService, TenantService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {}
