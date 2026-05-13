import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTranslationHistoryDto {
  @IsString()
  @IsNotEmpty()
  translated_text: string;
}
