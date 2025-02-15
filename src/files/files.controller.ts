import { Controller, Get, Post, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, resolve } from 'path';
import * as fs from 'fs';
import { FilesService } from './files.service';

@Controller('uploads')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      storage: diskStorage({
        destination: resolve(__dirname, '..', '..', 'uploads', 'deepseek'), // Nouveau dossier pour les fichiers DeepSeek
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('Aucun fichier uploadé.');
      }

      // Créer le dossier 'uploads/deepseek' s'il n'existe pas
      const uploadDir = resolve(__dirname, '..', '..', 'uploads', 'deepseek');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      return this.filesService.saveFiles(files);
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers :', error);
      throw new BadRequestException('Erreur lors de l\'upload des fichiers : ' + error.message);
    }
  }

  @Get()
  async getFiles() {
    try {
      return this.filesService.getAllFiles();
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers :', error);
      throw new BadRequestException('Erreur lors de la récupération des fichiers : ' + error.message);
    }
  }
}
