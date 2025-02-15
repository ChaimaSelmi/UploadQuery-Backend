import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { DeepSeekService } from './deepseek.service';

@Controller('query')
export class DeepSeekController {
  constructor(private readonly deepSeekService: DeepSeekService) {}

  @Post()
  async query(@Body() body: { question: string; fileId: string }, @Res() res: Response) {
    const { question, fileId } = body;
    try {
      const response = await this.deepSeekService.queryDeepSeek(question, fileId);
      return res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la requête:', error.message);
      return res.status(500).json({
        statusCode: 500,
        message: error.message || 'Erreur interne du serveur',
      });
    }
  }
}
