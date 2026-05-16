import { Injectable } from '@nestjs/common';
import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';

import {
  DOCX_FONT_BY_SCRIPT,
  DocxTextRunOptions,
  MIME_TYPES,
  PDF_FONT_BY_SCRIPT,
  SupportedScript,
} from '@/module/ai-core/constants/font-text';
import pdfMake from 'pdfmake';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  TranslateExportRequestDto,
  type TranslateExportFormat,
} from '../dto/translate-request.dto';

@Injectable()
export class TranslateExportService {
  async export(dto: TranslateExportRequestDto) {
    const filename = this.buildFilename(dto.filename, dto.format);
    const buffer =
      dto.format === 'docx'
        ? await this.createDocx(dto.text, dto.title)
        : await this.createPdf(dto.text, dto.title);

    return {
      buffer,
      filename,
      mimeType: MIME_TYPES[dto.format],
    };
  }

  private async createDocx(text: string, title?: string) {
    const paragraphs = this.toTextBlocks(text).map(
      (block) =>
        new Paragraph({
          children: [
            ...this.toDocxTextRuns(block, {
              size: 24,
            }),
          ],
          spacing: {
            after: 180,
            line: 360,
          },
        }),
    );

    const document = new Document({
      sections: [
        {
          children: [
            ...(title?.trim()
              ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: this.toDocxTextRuns(title.trim(), {
                      bold: true,
                      size: 32,
                    }),
                    spacing: {
                      after: 300,
                    },
                  }),
                ]
              : []),
            ...paragraphs,
          ],
        },
      ],
    });

    return Packer.toBuffer(document);
  }

  private async createPdf(text: string, title?: string) {
    const content: Content[] = [
      ...(title?.trim()
        ? [
            {
              text: this.toPdfTextRuns(title.trim()),
              style: 'title',
              alignment: 'center' as const,
              margin: [0, 0, 0, 18] as [number, number, number, number],
            },
          ]
        : []),
      ...this.toTextBlocks(text).map((block) => ({
        text: this.toPdfTextRuns(block),
        margin: [0, 0, 0, 10] as [number, number, number, number],
      })),
    ];

    const definition: TDocumentDefinitions = {
      content,
      defaultStyle: {
        font: PDF_FONT_BY_SCRIPT.default,
        fontSize: 12,
        lineHeight: 1.35,
      },
      styles: {
        title: {
          bold: true,
          fontSize: 18,
        },
      },
      pageMargins: [48, 56, 48, 56],
    };

    return pdfMake.createPdf(definition).getBuffer();
  }

  private toPdfTextRuns(text: string) {
    return this.segmentTextByScript(text).map((segment) => ({
      text: segment.text,
      font: PDF_FONT_BY_SCRIPT[segment.script],
    }));
  }

  private toDocxTextRuns(text: string, options: DocxTextRunOptions) {
    return this.segmentTextByScript(text).map(
      (segment) =>
        new TextRun({
          ...options,
          text: segment.text,
          font: DOCX_FONT_BY_SCRIPT[segment.script],
        }),
    );
  }

  private segmentTextByScript(text: string) {
    const segments: Array<{ script: SupportedScript; text: string }> = [];

    for (const char of text) {
      const script = this.detectScript(char);
      const lastSegment = segments[segments.length - 1];

      if (lastSegment?.script === script) {
        lastSegment.text += char;
      } else {
        segments.push({ script, text: char });
      }
    }

    return segments;
  }

  private detectScript(char: string): SupportedScript {
    if (
      /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/u.test(
        char,
      )
    ) {
      return 'cjk';
    }

    if (/[\u0e00-\u0e7f]/u.test(char)) {
      return 'thai';
    }

    return 'default';
  }

  private toTextBlocks(text: string) {
    const normalizedText = text.replace(/\r\n/g, '\n').trim();

    if (!normalizedText) {
      return [''];
    }

    return normalizedText
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
  }

  private buildFilename(
    filename: string | undefined,
    format: TranslateExportFormat,
  ) {
    const baseName = (filename?.trim() || 'ban-dich')
      .replace(/\.[^.]+$/, '')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);

    return `${baseName || 'ban-dich'}.${format}`;
  }
}
