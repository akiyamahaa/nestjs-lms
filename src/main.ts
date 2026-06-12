import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './common/swagger/swagger.config';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

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
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://nextjs-history-lms.vercel.app',
      'https://fin-edu.vercel.app',
      'https://thinklab-2110.vercel.app',
      'https://anh-hung-su-viet.vercel.app',
      'https://math-tek.vercel.app',
      'https://historyfun.vercel.app'
    ], // Cho phép cả localhost và 127.0.0.1
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
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
