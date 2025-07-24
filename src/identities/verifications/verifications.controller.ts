import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationsService } from './providers/verifications.service';
import { VerifyOtpDto } from './dto/verifyOtp.dto';

@ApiTags('Email Verification')
@Controller('verification')
export class VerificationsController {
  constructor(private readonly verificationService: VerificationsService) {}

  @Post('send-otp')
  async sendOtp(@Body('userId') userId: string) {
    return this.verificationService.generateAndSaveOtp(userId);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto : VerifyOtpDto ) {
    return this.verificationService.verifyOtp(dto.userId, dto.otpCode);
  }
}
