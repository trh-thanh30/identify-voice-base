import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  translateApi,
  type TranslateExportFormat,
} from "@/feature/translate/api/translate.api";
import { formatError } from "@/utils";

interface UseDownloadTranslatedFileOptions {
  filename: string;
  text: string;
  title?: string;
}

export function useDownloadTranslatedFile({
  filename,
  text,
  title,
}: UseDownloadTranslatedFileOptions) {
  const [exportingFormat, setExportingFormat] =
    useState<TranslateExportFormat | null>(null);

  const downloadTranslatedFile = useCallback(
    async (format: TranslateExportFormat) => {
      const exportText = text.trim();
      if (!exportText || exportingFormat) return;

      setExportingFormat(format);

      try {
        const blob = await translateApi.exportTranslation({
          text: exportText,
          format,
          filename,
          title,
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${filename}.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success(`Đã tải ${format.toUpperCase()}.`);
      } catch (error) {
        toast.error(formatError(error));
      } finally {
        setExportingFormat(null);
      }
    },
    [exportingFormat, filename, text, title],
  );

  return {
    downloadTranslatedFile,
    exportingFormat,
  };
}
