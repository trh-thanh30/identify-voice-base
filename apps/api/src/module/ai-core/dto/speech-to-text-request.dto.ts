import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  SPEECH_TO_TEXT_LANGUAGES,
  type SpeechToTextLanguage,
} from '@/module/ai-core/constants/languages';

const booleanStringToBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const rawBooleanStringToBoolean = ({
  obj,
  key,
  value,
}: {
  obj: Record<string, unknown>;
  key: string;
  value: unknown;
}) => booleanStringToBoolean(obj[key] ?? value);

export class SpeechToTextRequestDto {
  @IsOptional()
  @IsIn(SPEECH_TO_TEXT_LANGUAGES)
  language?: SpeechToTextLanguage;

  @IsOptional()
  @Transform(rawBooleanStringToBoolean)
  @IsBoolean()
  return_timestamp?: boolean;

  @IsOptional()
  @Transform(rawBooleanStringToBoolean)
  @IsBoolean()
  denoise_audio?: boolean;
}
