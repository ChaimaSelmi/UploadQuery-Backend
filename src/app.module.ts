import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from './files/files.module';
import { DeepSeekModule } from './deepseek.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    FilesModule,
    DeepSeekModule,
  ],
})
export class AppModule {}
