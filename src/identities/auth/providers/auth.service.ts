import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignUpDto } from '../dto/sign-up.dto';
import { UsersService } from 'src/identities/users/providers/users.service';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ConfigService } from '@nestjs/config';
import { JwtConfig } from 'src/common/types/jwt-config.interface';
import { EConfigKeys } from 'src/common/types/config-keys';
import { VerificationsService } from 'src/identities/verifications/providers/verifications.service';
import { EmailService } from 'src/common/modules/email/providers/email.service';
import { SignInDto } from '../dto/sign-in.dto';
import { IAuthToken } from '../interfaces/auth-tokens.interface';
import { User } from 'generated/prisma';
import { HashingProvider } from './hashing.provider';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwt: JwtService,
    private verificationsService: VerificationsService,
    private config: ConfigService,
    private emailService: EmailService,
    private hashingProvider: HashingProvider,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const user = await this.usersService.createUser(signUpDto);
    const otp = await this.verificationsService.generateAndSaveOtp(user.id);
    await this.emailService.sendOtp(user.email, otp.code);
    return {
      message: 'OTP sent to email',
    };
  }

  public async signIn(dto: SignInDto): Promise<IAuthToken> {
    //   Find the user using email ID
    let user: User | null = null;

    try {
      user = await this.usersService.findOneByEmailWithPassword(dto.email);
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid email or password');
    }

    //   Compare password to the hash
    let isEqual: boolean = false;

    try {
      isEqual = await this.hashingProvider.comparePassword(
        dto.password,
        user.password || '',
      );
    } catch (e) {
      throw new RequestTimeoutException(e, {
        description: 'Could not compare passwords',
      });
    }
    if (!isEqual) {
      throw new UnauthorizedException('Wrong email or password');
    }

    if (!user.isVerified) {
      await this.handleUnverifiedUser(user);
      throw new UnauthorizedException(
        'Account not verified. A new OTP has been sent to your email.',
      );
    }

    //   Send confirmation
    return this.signToken(user.id, user.email, user.role);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ access_token: string }> {
    const checkVerify = await this.verificationsService.verifyOtp(
      dto.userId,
      dto.otpCode,
    );
    if (!checkVerify) {
      throw new ForbiddenException('Invalid or expired OTP');
    }
    const user = await this.prisma.user.update({
      where: { id: dto.userId },
      data: { isVerified: true },
    });

    // (Optional) generate token
    return this.signToken(user.id, user.email, user.role);
  }

  async resendOtp(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('User already verified');

    const otp = await this.verificationsService.generateAndSaveOtp(user.id);
    await this.emailService.sendOtp(email, otp.code);

    return { message: 'OTP resent successfully' };
  }

  async signToken(
    userId: number,
    email: string,
    role: string,
  ): Promise<IAuthToken> {
    const jwtConfig = this.config.get<JwtConfig>(EConfigKeys.JWT);
    if (!jwtConfig) {
      throw new Error(
        `JWT configuration is missing for key: ${EConfigKeys.JWT}`,
      );
    }

    const payload = {
      sub: userId,
      email,
      role,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: `${jwtConfig.accessTokenTtl}s`,
      secret: jwtConfig.secret,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: jwtConfig.refreshTokenSecret,
      expiresIn: `${jwtConfig.refreshTokenTtl}s`,
    });
    return {
      access_token: token,
      refresh_token: refreshToken,
      role: role,
    };
  }

  private async handleUnverifiedUser(user: User) {
    const otp = await this.verificationsService.generateAndSaveOtp(user.id);
    await this.emailService.sendOtp(user.email, otp.code);
  }
}
