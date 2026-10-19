
import {
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { resolve } from 'path';
import * as fs from 'fs';
import { FilesService } from './files.service';

const uploadDir = process.env.UPLOAD_DIR || resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller('uploads')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          cb(null, `${uuidv4()}${file.originalname}`);
        },
      }),
    }),
  )
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier uploadé.');
    }

    try {
      return await this.filesService.saveFiles(files);
    } catch (error) {
      console.error("Erreur lors de l'upload :", error);
      throw error;
    }
  }

  @Get()
  async getFiles() {
    return this.filesService.getAllFiles();
  }
}
