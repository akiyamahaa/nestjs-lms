import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<SentMessageInfo> {
    return await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }

  async sendOtp(email: string, otp: string): Promise<SentMessageInfo> {
    try {
      await this.sendEmail(email, 'Your OTP Code', 'email-otp', { email, otp });
    } catch (error) {
      console.error('📧 Lỗi gửi email:', error);
      throw new InternalServerErrorException('Gửi email thất bại');
    }
  }
}
