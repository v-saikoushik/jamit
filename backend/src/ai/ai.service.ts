import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.baseUrl = config.get('AI_SERVICE_URL') || 'http://localhost:8000';
  }

  async separateAudio(filePath: string) {
    const { data } = await axios.post(`${this.baseUrl}/api/separate`, { file_path: filePath });
    return data;
  }

  async detectMood(text: string) {
    const { data } = await axios.post(`${this.baseUrl}/api/mood/detect`, { text });
    return data;
  }

  async getRecommendations(mood: string, songIds?: string[]) {
    const { data } = await axios.post(`${this.baseUrl}/api/recommend`, {
      mood,
      song_ids: songIds || [],
    });
    return data;
  }

  async createRemix(vocalsPath: string, instrumentalsPath: string, outputName: string) {
    const { data } = await axios.post(`${this.baseUrl}/api/remix/create`, {
      vocals_path: vocalsPath,
      instrumentals_path: instrumentalsPath,
      output_name: outputName,
    });
    return data;
  }

  async trimAudio(inputPath: string, outputName: string, startTime: number, duration: number) {
    const { data } = await axios.post(`${this.baseUrl}/api/audio-editor/trim`, {
      input_path: inputPath,
      output_name: outputName,
      start_time: startTime,
      duration,
    });
    return data;
  }

  async mergeAudio(inputPaths: string[], outputName: string) {
    const { data } = await axios.post(`${this.baseUrl}/api/audio-editor/merge`, {
      input_paths: inputPaths,
      output_name: outputName,
    });
    return data;
  }
}
