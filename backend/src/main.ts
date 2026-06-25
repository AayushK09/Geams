import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const logger = new Logger('Bootstrap');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
        }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    })
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = parseInt(process.env.BACKEND_PORT || '3000');
  const host = process.env.BACKEND_HOST || '0.0.0.0';
  const nodeEnv = process.env.NODE_ENV || 'development';

  await app.listen(port, host);

  logger.log(`════════════════════════════════════════════`);
  logger.log(`🚀 GEAMS Backend is running!`);
  logger.log(`════════════════════════════════════════════`);
  logger.log(`📡 Server: http://${host}:${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📊 Health Check: http://${host}:${port}/health`);
  logger.log(`════════════════════════════════════════════`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start server:', err);
  process.exit(1);
});
