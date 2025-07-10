import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationsService } from './providers/verifications.service';

@ApiTags('Email Verification')
@Controller('verification')
export class VerificationsController {
  constructor(private readonly verificationService: VerificationsService) {}

  @Post('send-otp')
  async sendOtp(@Body('userId') userId: string) {
    return this.verificationService.generateAndSaveOtp(userId);
  }

  @Post('verify-otp')
  async verifyOtp(@Body('userId') userId: string, @Body('code') code: string) {
    return this.verificationService.verifyOtp(userId, code);
  }
}
