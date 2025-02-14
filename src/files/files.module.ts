import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './files.schema'; 
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DeepSeekService } from 'src/deepseek.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema
     }]),
  ],
  controllers: [FilesController],
  providers: [FilesService, DeepSeekService],
  exports: [MongooseModule],
})
export class FilesModule {}
