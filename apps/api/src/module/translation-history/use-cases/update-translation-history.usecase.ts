import { BadRequestError } from '@/common/response';
import { BaseUseCase } from '@/shared/interfaces/base-usecase.interface';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TranslationHistoryRepository } from '../repository/translation-history.repository';

export interface UpdateTranslationHistoryInput {
  id: string;
  translatedText: string;
  editorId: string;
  editorRole: Role;
}

@Injectable()
export class UpdateTranslationHistoryUseCase implements BaseUseCase<
  UpdateTranslationHistoryInput,
  Promise<unknown>
> {
  constructor(
    private readonly translationHistoryRepository: TranslationHistoryRepository,
  ) {}

  async execute(input: UpdateTranslationHistoryInput) {
    const translatedText = input.translatedText.trim();

    if (!translatedText) {
      throw new BadRequestError('Nội dung bản dịch không được để trống.');
    }

    const record = await this.translationHistoryRepository.findById(input.id);

    if (!record) {
      throw new BadRequestError('Không tìm thấy bản dịch.');
    }

    if (input.editorRole !== Role.ADMIN && record.user_id !== input.editorId) {
      throw new BadRequestError('Bạn không có quyền sửa bản dịch này.');
    }

    const updated =
      await this.translationHistoryRepository.updateEditedTranslation(
        input.id,
        translatedText,
        input.editorId,
      );

    return {
      id: updated.id,
      source_text: updated.source_text,
      translated_text: updated.translated_text,
      edited_translated_text: updated.edited_translated_text,
      effective_translated_text:
        updated.edited_translated_text ?? updated.translated_text,
      edited_at: updated.edited_at,
      edited_by: updated.edited_by,
      source_lang: updated.source_lang,
      target_lang: updated.target_lang,
      source_file_type: updated.source_file_type,
      mode: updated.mode,
      created_at: updated.created_at,
      operator: updated.operator,
    };
  }
}
