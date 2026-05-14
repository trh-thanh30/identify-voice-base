import { useCallback, useState } from "react";

import type { TranslateExportFormat } from "@/feature/translate/api/translate.api";

export const TRANSLATE_EXPORT_FORMATS: TranslateExportFormat[] = [
  "docx",
  "pdf",
];

interface UseDownloadFormatDropdownOptions {
  disabled?: boolean;
  onDownload: (format: TranslateExportFormat) => void | Promise<void>;
}

export function useDownloadFormatDropdown({
  disabled = false,
  onDownload,
}: UseDownloadFormatDropdownOptions) {
  const [open, setOpen] = useState(false);

  const selectFormat = useCallback(
    async (format: TranslateExportFormat) => {
      if (disabled) return;

      setOpen(false);
      await onDownload(format);
    },
    [disabled, onDownload],
  );

  return {
    formats: TRANSLATE_EXPORT_FORMATS,
    open,
    selectFormat,
    setOpen,
  };
}
