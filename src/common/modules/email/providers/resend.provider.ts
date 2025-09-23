import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, SendParams } from '../email.types';

@Injectable()
export class ResendProvider implements EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly apiKey = process.env.RESEND_API_KEY ?? '';
  private readonly from = process.env.EMAIL_FROM ?? 'no-reply@yourdomain.com';

  async send(params: SendParams): Promise<any> {
    if (!this.apiKey) throw new Error('RESEND_API_KEY is missing');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        headers: params.headers,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend ${res.status}: ${body}`);
    }
    const data = await res.json();
    this.logger.log(`Resend ok id=${data.id}`);
    return data;
  }

  async sendOtp(to: string, otp: string) {
    const subject = 'Your OTP Code';
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
        <p>Xin chào,</p>
        <p>Mã OTP của bạn là:</p>
        <p style="font-size:20px;font-weight:700;letter-spacing:2px">${otp}</p>
        <p>Mã có hiệu lực trong 5 phút.</p>
      </div>`;
    return this.send({ to, subject, html, text: `Your OTP is: ${otp}` });
  }
}
