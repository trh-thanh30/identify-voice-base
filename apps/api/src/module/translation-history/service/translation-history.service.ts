import { Injectable } from '@nestjs/common';
import { TranslationHistoryFilterDto } from '../dto/translation-history-filter.dto';
import {
  RecordTranslationInput,
  RecordTranslationUseCase,
} from '../use-cases/record-translation.usecase';
import { FindTranslationHistoryUseCase } from '../use-cases/find-translation-history.usecase';

@Injectable()
export class TranslationHistoryService {
  constructor(
    private readonly recordTranslationUseCase: RecordTranslationUseCase,
    private readonly findTranslationHistoryUseCase: FindTranslationHistoryUseCase,
  ) {}

  async recordTranslation(input: RecordTranslationInput) {
    return this.recordTranslationUseCase.execute(input);
  }

  async findAll(filter: TranslationHistoryFilterDto) {
    return this.findTranslationHistoryUseCase.execute(filter);
  }
}
