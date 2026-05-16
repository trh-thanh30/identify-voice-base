import { TranslateExportFormat } from '@/module/ai-core/dto/translate-request.dto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import pdfMake from 'pdfmake';

export type SupportedScript = keyof typeof PDF_FONT_BY_SCRIPT;
export type DocxTextRunOptions = {
  bold?: boolean;
  size: number;
};
type PdfMakeWithUrlPolicy = typeof pdfMake & {
  setUrlAccessPolicy?: (callback: (url: string) => boolean) => void;
};

const MIME_TYPES: Record<TranslateExportFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
};

const FONT_DIR = resolveFontDir();
const PDF_FONTS = {
  NotoSans: {
    normal: path.join(FONT_DIR, 'NotoSans-Regular.ttf'),
    bold: path.join(FONT_DIR, 'NotoSans-Bold.ttf'),
    italics: path.join(FONT_DIR, 'NotoSans-Regular.ttf'),
    bolditalics: path.join(FONT_DIR, 'NotoSans-Bold.ttf'),
  },
  NotoSansThai: {
    normal: path.join(FONT_DIR, 'NotoSansThai-Regular.ttf'),
    bold: path.join(FONT_DIR, 'NotoSansThai-Bold.ttf'),
    italics: path.join(FONT_DIR, 'NotoSansThai-Regular.ttf'),
    bolditalics: path.join(FONT_DIR, 'NotoSansThai-Bold.ttf'),
  },
  NotoSansCJK: {
    normal: path.join(FONT_DIR, 'NotoSansCJKsc-Regular.otf'),
    bold: path.join(FONT_DIR, 'NotoSansCJKsc-Bold.otf'),
    italics: path.join(FONT_DIR, 'NotoSansCJKsc-Regular.otf'),
    bolditalics: path.join(FONT_DIR, 'NotoSansCJKsc-Bold.otf'),
  },
};

const PDF_FONT_BY_SCRIPT = {
  default: 'NotoSans',
  thai: 'NotoSansThai',
  cjk: 'NotoSansCJK',
} as const;

const DOCX_FONT_BY_SCRIPT = {
  default: {
    ascii: 'Noto Sans',
    hAnsi: 'Noto Sans',
    eastAsia: 'Noto Sans',
    cs: 'Noto Sans',
  },
  thai: {
    ascii: 'Noto Sans Thai',
    hAnsi: 'Noto Sans Thai',
    eastAsia: 'Noto Sans Thai',
    cs: 'Noto Sans Thai',
  },
  cjk: {
    ascii: 'Noto Sans CJK SC',
    hAnsi: 'Noto Sans CJK SC',
    eastAsia: 'Noto Sans CJK SC',
    cs: 'Noto Sans CJK SC',
  },
} as const;

pdfMake.setFonts(PDF_FONTS);
(pdfMake as PdfMakeWithUrlPolicy).setUrlAccessPolicy?.(() => false);

function resolveFontDir() {
  const candidates = [
    path.resolve(__dirname, '../../../../assets/fonts'),
    path.resolve(__dirname, '../../../assets/fonts'),
    path.resolve(process.cwd(), 'dist/assets/fonts'),
    path.resolve(process.cwd(), 'src/assets/fonts'),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export { DOCX_FONT_BY_SCRIPT, MIME_TYPES, PDF_FONT_BY_SCRIPT };
