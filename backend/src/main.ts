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
server.use(express.static(path.join(__dirname, '..', 'public')));

// ✅ SPA FALLBACK (React routing)
server.get('*', (req: express.Request, res: express.Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

  await app.listen(3000);

  console.log('🚀 Server running on http://localhost:3000');

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED ERROR:', err);
  });
}

bootstrap();