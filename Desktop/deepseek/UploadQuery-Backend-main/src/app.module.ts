import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepSeekService } from './deepseek.service';
import { DeepSeekController } from './deepseek.controller';
import { File, FileSchema } from './files/files.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeepSeekModule } from './deepseek.module';
import { FilesModule } from './files/files.module';


@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    ConfigModule.forRoot({
      isGlobal: true, 
  }), DeepSeekModule, FilesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
