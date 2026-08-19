import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// Defensive net: an unhandled promise rejection anywhere in the app otherwise
// crashes the entire Node process by default (this bit us once already — see
// TenantRlsInterceptor's history). Logging instead of crashing means a bug in
// one request degrades that request, not the whole server for everyone.
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled promise rejection (server stayed up):', reason);
});

// Known placeholder values shipped in .env.example — anyone who forgets to
// change these before deploying would have tokens forgeable by anyone who's
// seen this (public) repo. Checked at startup, not left to be discovered later.
const INSECURE_JWT_DEFAULTS = ['change-me-access-secret', 'change-me-refresh-secret'];

function assertSecureJwtSecrets(config: ConfigService) {
  const accessSecret = config.get<string>('JWT_ACCESS_SECRET');
  const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');
  const problems: string[] = [];

  if (!accessSecret) problems.push('JWT_ACCESS_SECRET is not set.');
  else if (INSECURE_JWT_DEFAULTS.includes(accessSecret))
    problems.push('JWT_ACCESS_SECRET is still the .env.example placeholder value.');
  else if (accessSecret.length < 32)
    problems.push('JWT_ACCESS_SECRET is shorter than 32 characters — too weak.');

  if (!refreshSecret) problems.push('JWT_REFRESH_SECRET is not set.');
  else if (INSECURE_JWT_DEFAULTS.includes(refreshSecret))
    problems.push('JWT_REFRESH_SECRET is still the .env.example placeholder value.');
  else if (refreshSecret.length < 32)
    problems.push('JWT_REFRESH_SECRET is shorter than 32 characters — too weak.');

  if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
    problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical.');
  }

  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error('Refusing to start: insecure JWT configuration.');
    problems.forEach((p) => console.error(`  - ${p}`));
    // eslint-disable-next-line no-console
    console.error('Generate real secrets with: openssl rand -hex 32');
    process.exit(1);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const config = app.get(ConfigService);

  assertSecureJwtSecrets(config);

  app.use(helmet());
  app.setGlobalPrefix(config.get<string>('API_GLOBAL_PREFIX', 'api/v1'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SchoolERP API')
    .setDescription('Phase 0 — Platform Foundation & Core Admin API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`SchoolERP API listening on port ${port}`);
}
bootstrap();