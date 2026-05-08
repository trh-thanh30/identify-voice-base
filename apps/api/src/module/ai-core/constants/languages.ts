export const TRANSLATION_LANGUAGES = [
  'zh',
  'zh-Hant',
  'yue',
  'en',
  'fr',
  'de',
  'it',
  'pt',
  'es',
  'nl',
  'pl',
  'cs',
  'uk',
  'ru',
  'ar',
  'fa',
  'he',
  'tr',
  'hi',
  'bn',
  'ur',
  'gu',
  'te',
  'mr',
  'ta',
  'ja',
  'ko',
  'th',
  'vi',
  'ms',
  'id',
  'tl',
  'km',
  'my',
  'lo',
  'bo',
  'kk',
  'mn',
  'ug',
] as const;

export type TranslationLanguage = (typeof TRANSLATION_LANGUAGES)[number];

export const OCR_LANGUAGES = TRANSLATION_LANGUAGES;

export type OcrLanguage = TranslationLanguage;

export const SPEECH_TO_TEXT_LANGUAGES = TRANSLATION_LANGUAGES;

export type SpeechToTextLanguage = TranslationLanguage;
