import { BaseUseCase } from '@/shared/interfaces/base-usecase.interface';
import { Injectable } from '@nestjs/common';
import { TranslationHistoryFilterDto } from '../dto/translation-history-filter.dto';
import { TranslationHistoryRepository } from '../repository/translation-history.repository';

@Injectable()
export class FindTranslationHistoryUseCase implements BaseUseCase<
  TranslationHistoryFilterDto,
  Promise<unknown>
> {
  constructor(
    private readonly translationHistoryRepository: TranslationHistoryRepository,
  ) {}

  async execute(filter: TranslationHistoryFilterDto) {
    const result = await this.translationHistoryRepository.findAll(filter);

    return {
      items: result.items.map((item) => ({
        id: item.id,
        source_text: item.source_text,
        translated_text: item.translated_text,
        source_lang: item.source_lang,
        target_lang: item.target_lang,
        source_file_type: item.source_file_type,
        mode: item.mode,
        created_at: item.created_at,
        operator: item.operator,
      })),
      stats: result.stats,
      pagination: result.pagination,
    };
  }
}
