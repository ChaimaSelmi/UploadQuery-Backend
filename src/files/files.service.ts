import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File } from './files.schema';

@Injectable()
export class FilesService {
  constructor(@InjectModel(File.name) private fileModel: Model<File>) {}

  async saveFiles(files: Express.Multer.File[]) {
    try {
      // Vérifier si des fichiers ont été uploadés
      if (!files || files.length === 0) {
        throw new BadRequestException('Aucun fichier uploadé.');
      }

      // Préparer les données à enregistrer dans la base de données
      const uploads = files.map(file => ({
        filename: file.filename, // Utiliser le nom original du fichier
        path: file.path, // Utiliser le chemin généré par diskStorage
      }));

      // Enregistrer les fichiers dans la base de données
      await this.fileModel.insertMany(uploads);
      return { message: 'Fichiers uploadés avec succès !' };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des fichiers :', error);
      throw new BadRequestException('Erreur lors de l\'enregistrement des fichiers : ' + error.message);
    }
  }

  async getAllFiles() {
    try {
      return await this.fileModel.find({}, 'filename path _id').exec();
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers :', error);
      throw new BadRequestException('Erreur lors de la récupération des fichiers : ' + error.message);
    }
  }
}