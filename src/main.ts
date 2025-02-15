import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'https://uploadquery-frontend-2.onrender.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });
  
  await app.listen(3001);

}
bootstrap();
