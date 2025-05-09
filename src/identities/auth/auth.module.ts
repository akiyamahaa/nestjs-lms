import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { EConfigKeys } from 'src/common/types/config-keys';
import { JwtConfig } from 'src/common/types/jwt-config.interface';
import { ConfigAppModule } from 'src/configs/config-app.module';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigAppModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.get<JwtConfig>(EConfigKeys.JWT);
        if (!jwtConfig) {
          throw new Error(
            `JWT configuration is missing for key: ${EConfigKeys.JWT}`,
          );
        }
        return {
          secret: jwtConfig.secret,
          signOptions: {
            expiresIn: `${jwtConfig.accessTokenTtl}s`,
            audience: jwtConfig.audience,
            issuer: jwtConfig.issuer,
          },
        };
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, AuthService],
  exports: [JwtAuthGuard, JwtModule], // Export JwtGuard và JwtModule
})
export class AuthModule {}
