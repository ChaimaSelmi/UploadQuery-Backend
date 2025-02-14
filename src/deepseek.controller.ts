import { Controller, Post, Body } from '@nestjs/common';
import { DeepSeekService } from './deepseek.service';

@Controller('query')
export class DeepSeekController {
  constructor(private readonly deepSeekService: DeepSeekService) {}

  @Post()
  async query(@Body() body: { question: string; fileId: string }) {
    const { question, fileId } = body;
    try {
      const response = await this.deepSeekService.queryDeepSeek(question, fileId);
      return response;
    } catch (error) {
      console.error('Erreur lors de la requête:', error.message);
      throw error;
    }
  }
}
