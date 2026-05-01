import { BaseUseCase } from '@/shared/interfaces/base-usecase.interface';
import { Injectable } from '@nestjs/common';
import { TranslationMode } from '@prisma/client';
import { TranslationHistoryRepository } from '../repository/translation-history.repository';

export interface RecordTranslationInput {
  userId: string;
  sourceText: string;
  translatedText: string;
  sourceLang?: string;
  targetLang?: string;
  mode: 'translate' | 'summarize';
}

@Injectable()
export class RecordTranslationUseCase implements BaseUseCase<
  RecordTranslationInput,
  Promise<unknown>
> {
  constructor(
    private readonly translationHistoryRepository: TranslationHistoryRepository,
  ) {}

  async execute(input: RecordTranslationInput) {
    const sourceText = input.sourceText.trim();
    const translatedText = input.translatedText.trim();

    if (!sourceText || !translatedText) {
      return null;
    }

    return this.translationHistoryRepository.create({
      user_id: input.userId,
      source_text: sourceText,
      translated_text: translatedText,
      source_lang: input.sourceLang?.trim() || null,
      target_lang: input.targetLang ?? 'en',
      mode:
        input.mode === 'summarize'
          ? TranslationMode.SUMMARIZE
          : TranslationMode.TRANSLATE,
    });
  }
}
