import { registerAs } from '@nestjs/config';
import { EConfigKeys } from '../../common/types/config-keys';

const AppConfig = registerAs(EConfigKeys.AppConfig, () => ({
  Environment: process.env.NODE_ENV ?? 'production',
  FrontendUrl: process.env.FRONTEND_URL,
  DatabaseUrl: process.env.DATABASE_URL,
}));

export default AppConfig;
