import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Cho phép cả localhost và 127.0.0.1
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Nếu dùng cookie, JWT trong header
  });

  // ✅ Setup Swagger
  const port = parseInt(process.env.PORT ?? '5005', 10);
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app, port);
  }

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Error during app bootstrap:', error);
});
