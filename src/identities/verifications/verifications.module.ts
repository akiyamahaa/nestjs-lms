import { Module } from '@nestjs/common';
import { VerificationsService } from './providers/verifications.service';
import { VerificationsController } from './verifications.controller';
import { EmailModule } from 'src/common/modules/email/email.module';

@Module({
  controllers: [VerificationsController],
  providers: [VerificationsService],
  exports: [VerificationsService],
  imports: [EmailModule],
})
export class VerificationsModule {}
