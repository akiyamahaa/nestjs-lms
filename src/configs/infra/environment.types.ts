export type EnvironmentConfig = NodeJS.ProcessEnv & {
  // App Config
  NODE_ENV: string;
  FRONTEND_URL: string;
  DATABASE_URL: string;

  // JWT Config
  JWT_SECRET: string;
  JWT_REFRESH_TOKEN_SECRET: string;
  JWT_TOKEN_AUDIENCE: string;
  JWT_TOKEN_ISSUER: string;
  JWT_ACCESS_TOKEN_TTL: number;
  JWT_REFRESH_TOKEN_TTL: number;

  // Resend config
  RESEND_API_KEY: string;
  EMAIL_FROM: string;

  // Email Config
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USERNAME: string;
  EMAIL_PASSWORD: string;
};
