import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepSeekService } from './deepseek.service';
import { DeepSeekController } from './deepseek.controller';
import { File, FileSchema } from './files/files.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI!),
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
  ],
  controllers: [DeepSeekController],
  providers: [DeepSeekService],
})
export class AppModule {}
