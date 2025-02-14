import { Module } from '@nestjs/common';
import { DeepSeekService } from './deepseek.service';
import { DeepSeekController } from './deepseek.controller';
import { FilesModule } from './files/files.module';  

@Module({
  imports: [FilesModule],  
  providers: [DeepSeekService],
  controllers: [DeepSeekController],
})
export class DeepSeekModule {}
