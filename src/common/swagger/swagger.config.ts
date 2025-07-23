import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication, port: number = 5005): void {
  const config = new DocumentBuilder()
    .setTitle('📚 LMS API') // ✅ Project name
    .setDescription('API documentation for LMS, an online book marketplace') // ✅ API description
    .setVersion('1.0') // ✅ API version
    .addBearerAuth() // ✅ Enables JWT Authentication in Swagger UI
    // .setContact('LMS Team', 'https://lms.com', 'support@lms.com') // ✅ Contact info
    .setLicense('MIT', 'https://opensource.org/licenses/MIT') // ✅ License info
    // .addServer(`http://localhost:${port}`, 'Local Development') // ✅ Server definition
    .addServer(
      `${process.env.DOMAIN ? process.env.DOMAIN : `http://localhost:${port}`}`,
      'Development API',
    ) // ✅ Development API URL
    // .addServer('https://api.lms.com', 'Production API') // ✅ Production API URL
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // ✅ Keeps JWT token between page reloads
    },
    customSiteTitle: 'LMS API Documentation',
  });

  console.log(`📄 Swagger Docs available at http://localhost:${port}/docs`);
}
