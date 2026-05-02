import { Module } from '@nestjs/common';
import { AuthTokenService } from '../auth/service/auth-token.service';
import { TranslationHistoryRepository } from './repository/translation-history.repository';
import { TranslationHistoryService } from './service/translation-history.service';
import { TranslationHistoryController } from './translation-history.controller';
import { FindTranslationHistoryUseCase } from './use-cases/find-translation-history.usecase';
import { RecordTranslationUseCase } from './use-cases/record-translation.usecase';

@Module({
  controllers: [TranslationHistoryController],
  providers: [
    TranslationHistoryRepository,
    TranslationHistoryService,
    FindTranslationHistoryUseCase,
    RecordTranslationUseCase,
    AuthTokenService,
  ],
  exports: [TranslationHistoryService],
})
export class TranslationHistoryModule {}
