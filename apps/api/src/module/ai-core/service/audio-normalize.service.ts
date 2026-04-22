import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface NormalizedAudioFile {
  path: string;
  mimeType: 'audio/wav';
}

@Injectable()
export class AudioNormalizeService {
  private readonly logger = new Logger(AudioNormalizeService.name);

  async normalizeForAi(inputPath: string): Promise<NormalizedAudioFile> {
    const outputDir = path.join(os.tmpdir(), 'identify-voice-api');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `ai_audio_${uuidv4()}.wav`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec('pcm_s16le')
        .format('wav')
        .outputOptions(['-y'])
        .on('start', (cmdLine) => {
          this.logger.debug(`Bắt đầu chuẩn hóa audio: ${cmdLine}`);
        })
        .on('error', (err: Error) => {
          this.logger.error(`Lỗi chuẩn hóa audio: ${err.message}`);
          reject(
            new UnprocessableEntityException(
              'File audio không thể giải mã để chuẩn hóa, có thể đã bị hỏng hoặc dùng codec không được hỗ trợ. Vui lòng kiểm tra file gốc, xuất lại bản ghi và tải lên lại.',
            ),
          );
        })
        .on('end', () => {
          this.logger.debug(`Hoàn thành chuẩn hóa audio: ${outputPath}`);
          resolve();
        })
        .save(outputPath);
    });

    return {
      path: outputPath,
      mimeType: 'audio/wav',
    };
  }

  async cleanup(filePath?: string | null): Promise<void> {
    if (!filePath) return;

    try {
      await fs.unlink(filePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Không thể xóa audio tạm ${filePath}: ${message}`);
    }
  }
}
