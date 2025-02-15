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

    // Récupérer le fichier depuis la base de données
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      console.error('Fichier non trouvé dans la base de données');
      throw new Error('Fichier non trouvé');
    }

    // Construire le chemin complet du fichier
    const fullFilePath = path.resolve(__dirname, '..', 'uploads', file.filename);
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

      // Vérifier si le fichier PDF est vide ou non traitable
      if (!pdfData || !pdfData.text) {
        console.error('Le fichier PDF semble vide ou ne peut pas être traité');
        throw new Error('Le fichier PDF semble vide ou ne peut pas être traité');
      }

      // Extraire le texte du PDF
      const extractedText = pdfData.text;
      console.log('Texte extrait du fichier PDF:', extractedText);

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

      // Vérifier si une réponse a été générée
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