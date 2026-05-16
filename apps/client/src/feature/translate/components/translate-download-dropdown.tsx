import { ChevronDown, Download, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TranslateExportFormat } from "@/feature/translate/api/translate.api";
import { useDownloadFormatDropdown } from "@/feature/translate/hooks/use-download-format-dropdown";
import { cn } from "@/lib/utils";

interface TranslateDownloadDropdownProps {
  className?: string;
  disabled?: boolean;
  exportingFormat?: TranslateExportFormat | null;
  label?: string;
  onDownload: (format: TranslateExportFormat) => void | Promise<void>;
}

export function TranslateDownloadDropdown({
  className,
  disabled = false,
  exportingFormat = null,
  label = "Tải xuống",
  onDownload,
}: TranslateDownloadDropdownProps) {
  const isBusy = Boolean(exportingFormat);
  const dropdown = useDownloadFormatDropdown({
    disabled: disabled || isBusy,
    onDownload,
  });

  return (
    <Popover open={dropdown.open} onOpenChange={dropdown.setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("justify-between", className)}
          disabled={disabled || isBusy}
        >
          {isBusy ? (
            <LoaderCircle className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          <span>
            {isBusy ? `Đang tải ${exportingFormat?.toUpperCase()}` : label}
          </span>
          <ChevronDown className="ml-2 size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-40 p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex flex-col">
          {dropdown.formats.map((format) => (
            <button
              key={format}
              type="button"
              className="flex h-9 items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              onClick={() => void dropdown.selectFormat(format)}
            >
              <Download className="size-4 text-slate-500" />
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
