import { Module } from '@nestjs/common';
import { AdminChallengeController } from './admin-challenge.controller';
import { AdminChallengeService } from './admin-challenge.service';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { TenantService } from '../../common/services/tenant.service';

@Module({
  controllers: [AdminChallengeController, ChallengeController],
  providers: [AdminChallengeService, ChallengeService, TenantService],
  exports: [AdminChallengeService, ChallengeService],
})
export class ChallengeModule {} 