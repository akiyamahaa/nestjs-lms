import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import environmentValidation from './infra/environment.validation';
import AppConfig from './infra/app.config';
import JwtConfig from './infra/jwt.config';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV ? `.env.${ENV}` : '.env',
      load: [AppConfig, JwtConfig],
      validationSchema: environmentValidation,
    }),
  ],
})
export class ConfigAppModule {}
