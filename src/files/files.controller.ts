import { Controller, Get, Post, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { FilesService } from './files.service';
import * as fs from 'fs';

@Controller('uploads')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // Créer un nom de fichier unique
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      // Vérifier si des fichiers ont été uploadés
      if (!files || files.length === 0) {
        throw new BadRequestException('Aucun fichier uploadé.');
      }

      // Créer le dossier 'uploads' s'il n'existe pas
      if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads', { recursive: true });
      }

      // Enregistrer les fichiers dans la base de données
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