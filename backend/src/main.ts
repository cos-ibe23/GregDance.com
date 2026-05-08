import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  

    app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

 


  app.enableCors();
// ✅ SERVE REACT BUILD
const server = app.getHttpAdapter().getInstance();

// ✅ SPA FALLBACK (React routing)

  await app.listen(3001);

  console.log('🚀 Server running on http://localhost:3001');

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED ERROR:', err);
  });
}

bootstrap();