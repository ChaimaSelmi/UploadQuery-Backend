import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import axios from 'axios';
import { File } from './files/files.schema';

@Injectable()
export class DeepSeekService {
  constructor(@InjectModel(File.name) private readonly fileModel: Model<File>) {}

  async queryDeepSeek(question: string, fileId: string): Promise<any> {
    console.log('Requête reçue avec la question:', question, 'et fileId:', fileId);

    // Récupérer le fichier depuis la base de données
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      console.error('Fichier non trouvé dans la base de données');
      throw new Error('Fichier non trouvé');
    }

    // Construire le chemin complet du fichier
    const fullFilePath = path.resolve(__dirname, '..', '..', 'uploads', file.filename);
    console.log('Chemin complet du fichier:', fullFilePath);

    // Vérifier si le fichier existe
    if (!fs.existsSync(fullFilePath)) {
      console.error('Le fichier n\'existe pas à ce chemin:', fullFilePath);
      throw new Error('Le fichier n\'existe pas à ce chemin');
    }

    // Vérifier l'extension du fichier
    const fileExtension = path.extname(file.filename);
    if (fileExtension !== '.pdf') {
      console.error('Ce fichier n\'est pas un fichier PDF:', file.filename);
      throw new Error('Ce fichier n\'est pas un fichier PDF');
    }

    try {
      // Lire le fichier PDF
      const pdfBuffer = fs.readFileSync(fullFilePath);
      const pdfData = await pdfParse(pdfBuffer);

      if (!pdfData || !pdfData.text) {
        console.error('Le fichier PDF semble vide ou ne peut pas être traité');
        throw new Error('Le fichier PDF semble vide ou ne peut pas être traité');
      }

      // Interroger OpenRouter avec axios
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'Tu es un assistant intelligent.' },
            { role: 'user', content: `Document: ${pdfData.text}\nQuestion: ${question}` }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors du traitement de la requête:', error);
      throw new Error('Erreur lors du traitement de la requête: ' + error.message);
    }
  }
}
