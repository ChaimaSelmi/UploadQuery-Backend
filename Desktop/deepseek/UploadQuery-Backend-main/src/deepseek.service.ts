
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import { File } from './files/files.schema';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeepSeekService {
  private openai: OpenAI;

  constructor(
    @InjectModel(File.name)
    private readonly fileModel: Model<File>,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
    });
  }

  async queryDeepSeek(
    question: string,
    fileId: string,
  ): Promise<{ answer: string }> {
    console.log(
      'Requête reçue avec la question:',
      question,
      'et fileId:',
      fileId,
    );

    const file = await this.fileModel.findById(fileId);

    if (!file) {
      throw new NotFoundException(
        'Fichier non trouvé dans la base de données.',
      );
    }

    // Utiliser le même dossier que FilesController.
    const uploadDir =
      process.env.UPLOAD_DIR ||
      path.resolve(process.cwd(), 'uploads');

    const fullFilePath = path.join(uploadDir, file.filename);

    console.log('Chemin complet du fichier:', fullFilePath);

    if (!fs.existsSync(fullFilePath)) {
      console.error('PDF introuvable:', fullFilePath);

      throw new NotFoundException(
        'Le fichier PDF est introuvable sur le serveur. Veuillez envoyer le PDF à nouveau.',
      );
    }

    if (path.extname(file.filename).toLowerCase() !== '.pdf') {
      throw new BadRequestException(
        'Le fichier fourni doit être un PDF.',
      );
    }

    try {
      const pdfBuffer = fs.readFileSync(fullFilePath);
      const pdfData = await pdfParse(pdfBuffer);

      if (!pdfData?.text?.trim()) {
        throw new BadRequestException(
          'Le PDF est vide ou son texte ne peut pas être extrait.',
        );
      }

      const completion = await this.openai.chat.completions.create({
        model: 'deepseek/deepseek-v4-flash-20260731:free',
        messages: [
          {
            role: 'system',
            content:
              'Tu es un assistant intelligent. Réponds en français aux questions en te basant uniquement sur le contenu du document fourni. Si la réponse ne figure pas dans le document, indique-le clairement.',
          },
          {
            role: 'user',
            content: `Document :\n${pdfData.text}\n\nQuestion : ${question}`,
          },
        ],
      });

      const answer = completion.choices[0]?.message?.content;

      if (!answer) {
        throw new InternalServerErrorException(
          'DeepSeek n’a retourné aucune réponse.',
        );
      }

      return { answer };
    } catch (error) {
      console.error(
        'Erreur lors du traitement de la requête:',
        error,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erreur lors de l’analyse du PDF avec DeepSeek.',
      );
    }
  }
}
