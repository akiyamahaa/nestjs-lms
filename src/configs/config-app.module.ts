import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import environmentValidation from './infra/environment.validation';
import AppConfig from './infra/app.config';
import JwtConfig from './infra/jwt.config';
import { EnvironmentConfig } from './infra/environment.types';
import MailConfig from './infra/mail.config';

const env = process.env as EnvironmentConfig;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: env.NODE_ENV ? `.env.${env.NODE_ENV}` : '.env',
      load: [AppConfig, JwtConfig, MailConfig],
      validationSchema: environmentValidation,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigAppModule {}
