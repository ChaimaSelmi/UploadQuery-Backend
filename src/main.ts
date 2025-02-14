import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'https://upload-query-frontend.vercel.app'
  }); 
  await app.listen(3001);
}
bootstrap();
