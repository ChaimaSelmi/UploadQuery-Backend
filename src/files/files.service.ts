import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File } from './files.schema';

@Injectable()
export class FilesService {
  constructor(@InjectModel(File.name) private fileModel: Model<File>) {}

  async saveFiles(files: Express.Multer.File[]) {
    const uploads = files.map(file => ({
      filename: file.filename,  
      path: file.path,
    }));
  
    await this.fileModel.insertMany(uploads);
    return { message: 'Fichiers uploadés avec succès !' };
  }

  async getAllFiles() {
    return await this.fileModel.find({}, 'filename path _id').exec();
  }

 
}
