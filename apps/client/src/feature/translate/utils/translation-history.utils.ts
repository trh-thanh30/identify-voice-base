import { TRANSLATION_LANGUAGES } from "../constants/translate.constants";
import type { TranslationHistoryMode } from "../types/translate.types";

export function parseDateValue(value: string) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateLabel(value: string) {
  const date = parseDateValue(value);
  if (!date) return "Chọn ngày";

  return date.toLocaleDateString("vi-VN");
}

export function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;

  return [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

export function getLanguageLabel(languageCode?: string | null) {
  if (!languageCode) return "Tự động";

  return (
    TRANSLATION_LANGUAGES.find((language) => language.value === languageCode)
      ?.label ?? languageCode
  );
}

export function getFileTypeLabel(fileType?: string | null) {
  if (!fileType) return "-";

  const normalizedType = fileType.trim().toLowerCase();
  const labels: Record<string, string> = {
    audio: "Audio",
    document: "Tài liệu",
    image: "Ảnh",
    text: "Văn bản",
    pdf: "PDF",
    docx: "DOCX",
    txt: "TXT",
    png: "PNG",
    jpg: "JPG",
    jpeg: "JPEG",
    webp: "WEBP",
    bmp: "BMP",
    tif: "TIF",
    tiff: "TIFF",
    mp3: "MP3",
    wav: "WAV",
    m4a: "M4A",
    mp4: "MP4",
    webm: "WEBM",
    ogg: "OGG",
    flac: "FLAC",
  };

  return labels[normalizedType] ?? normalizedType.toUpperCase();
}

export function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ] as const;
}

export function getExportTitle(mode: TranslationHistoryMode) {
  return mode === "SUMMARIZE" ? "Bản dịch tóm tắt" : "Bản dịch";
}
