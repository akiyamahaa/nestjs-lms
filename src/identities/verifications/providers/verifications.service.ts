import { ForbiddenException, Injectable } from '@nestjs/common';
import { TenantService } from 'src/common/services/tenant.service';
import { PrismaClient } from 'generated/prisma';

/**
 * Service for handling email verification via OTP.
 * Provides functionality to generate, send, and verify OTPs.
 */
@Injectable()
export class VerificationsService {
  /**
   * Constructor: Dependency Injection for services and repositories.
   */
  constructor(private readonly tenantService: TenantService) {}

  private async getTenantPrisma(): Promise<PrismaClient> {
    return await this.tenantService.getPrismaClient();
  }

  async generateAndSaveOtp(userId: string) {
    const prisma = await this.getTenantPrisma();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    return await prisma.oTP.create({
      data: {
        userId,
        code,
        expiresAt,
        isUsed: false,
      },
    });
  }

  async verifyOtp(userId: string, code: string) {
    const prisma = await this.getTenantPrisma();
    const otp = await prisma.oTP.findFirst({
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
