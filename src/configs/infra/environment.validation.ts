import * as Joi from 'joi';

const environmentValidation = Joi.object({
  // App Config
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  FRONTEND_URL: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),

  // JWT Config
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().integer().required(),
  JWT_REFRESH_TOKEN_TTL: Joi.number().integer().required(),

  // Resend Config
  RESEND_API_KEY: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),

  // Email Config
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().integer().required(),
  EMAIL_USERNAME: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
});

export default environmentValidation;
