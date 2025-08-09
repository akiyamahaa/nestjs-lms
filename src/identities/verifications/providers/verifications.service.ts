import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Service for handling email verification via OTP.
 * Provides functionality to generate, send, and verify OTPs.
 */
@Injectable()
export class VerificationsService {
  /**
   * Constructor: Dependency Injection for services and repositories.
   */
  constructor(private prisma: PrismaService) {}

  async generateAndSaveOtp(userId: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    return await this.prisma.oTP.create({
      data: {
        userId,
        code,
        expiresAt,
        isUsed: false,
      },
    });
  }

  async verifyOtp(userId: string, code: string) {
    const otp = await this.prisma.oTP.findFirst({
      where: {
        userId,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) throw new ForbiddenException('Invalid or expired OTP');

    return { message: 'OTP verified successfully' };
  }
}
