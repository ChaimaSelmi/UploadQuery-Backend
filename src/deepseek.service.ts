import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import { File } from './files/files.schema';
import { OpenAI } from 'openai';

@Injectable()
export class DeepSeekService {
  private openai: OpenAI;

  constructor(@InjectModel(File.name) private readonly fileModel: Model<File>) {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1', 
      apiKey: process.env.OPENROUTER_API_KEY, 
    });
  }

  async queryDeepSeek(question: string, fileId: string): Promise<any> {
    console.log('Requête reçue avec la question:', question, 'et fileId:', fileId);

    const file = await this.fileModel.findById(fileId);
    if (!file) {
      throw new Error('Fichier non trouvé');
    }

    let filePath = path.normalize(file.path);
    if (!filePath.startsWith('uploads')) {
      filePath = path.join('uploads', filePath);
    }

    const fullFilePath = path.resolve(__dirname, '..', filePath);
    if (!fs.existsSync(fullFilePath)) {
      throw new Error('Le fichier n\'existe pas à ce chemin');
    }

    const fileExtension = path.extname(file.filename);
    if (fileExtension !== '.pdf') {
      throw new Error('Ce fichier n\'est pas un fichier PDF');
    }

    try {
      const pdfBuffer = fs.readFileSync(fullFilePath);
      const pdfData = await pdfParse(pdfBuffer);
      if (!pdfData || !pdfData.text) {
        throw new Error('Le fichier PDF semble vide ou ne peut pas être traité');
      }

      const extractedText = pdfData.text;
      console.log("Texte extrait du fichier PDF :", extractedText);

      // Interroger l'API OpenAI pour générer une réponse
      const response = await this.askDeepSeek(question, extractedText);
      return { answer: response };
    } catch (err) {
      console.error('Erreur lors de la lecture du fichier PDF:', err);
      throw new Error('Erreur lors de la lecture du fichier PDF : ' + err.message);
    }
  }

  // Fonction pour poser la question à l'API OpenAI 
  private async askDeepSeek(question: string, text: string): Promise<string> {
    try {
      const prompt = `Voici le texte extrait d'un fichier PDF. Répondez à la question suivante en vous basant sur ce texte :\n\n${text}\n\nQuestion : ${question}\nRéponse :`;

      // Utiliser l'API OpenAI pour générer la réponse
      const result = await this.openai.chat.completions.create({
        model: 'deepseek/deepseek-r1:free', 
        messages: [{ role: 'user', content: prompt }],
      });

      // Vérification si 'choices' est bien présent et qu'il contient des éléments
      if (result.choices && result.choices.length > 0) {
        const answer = result.choices[0].message.content ?? 'Aucune réponse générée.';
        return answer;
      } else {
        throw new Error('Aucune réponse générée par OpenAI');
      }
    } catch (err) {
      console.error('Erreur lors de l\'appel à l\'API OpenAI:', err);
      throw new Error('Erreur lors de l\'appel à l\'API OpenAI : ' + err.message);
    }
  }
}
