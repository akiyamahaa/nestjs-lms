import { Module } from '@nestjs/common';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';
import { TenantService } from '../common/services/tenant.service';

@Module({
  controllers: [ScoresController],
  providers: [ScoresService, TenantService],
  exports: [ScoresService],
})
export class ScoresModule {}
