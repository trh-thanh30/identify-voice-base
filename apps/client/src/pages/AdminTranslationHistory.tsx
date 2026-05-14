import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  Pencil,
  SearchX,
  X,
} from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { PageLayout } from "@/components/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QUERY_KEYS } from "@/constants";
import type { TranslateExportFormat } from "@/feature/translate/api/translate.api";
import { translateApi } from "@/feature/translate/api/translate.api";
import { TranslationHistoryDatePicker } from "@/feature/translate/components/translation-history-date-picker";
import { TRANSLATION_LANGUAGES } from "@/feature/translate/constants/translate.constants";
import { useDownloadFormatDropdown } from "@/feature/translate/hooks/use-download-format-dropdown";
import type {
  TranslationHistoryMode,
  TranslationHistoryRecord,
} from "@/feature/translate/types/translate.types";
import {
  buildPaginationItems,
  formatDateTime,
  getExportTitle,
  getFileTypeLabel,
  getLanguageLabel,
} from "@/feature/translate/utils/translation-history.utils";
import { useScrollOffset } from "@/hooks/use-scroll-offset";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { formatError } from "@/utils";

const ALL_LANGUAGES = "all";
const EDIT_TRANSLATION_PERMISSION = "translate.history.update";
const PAGINATION_SCROLL_OFFSET_Y = 128;
const EFFECTIVE_TRANSLATION_VIEW = "effective";
const ORIGINAL_TRANSLATION_VIEW = "original";

function getDisplayTranslatedText(
  record: Pick<
    TranslationHistoryRecord,
    "translated_text" | "edited_translated_text" | "effective_translated_text"
  >,
) {
  return (
    record.effective_translated_text ??
    record.edited_translated_text ??
    record.translated_text
  );
}

interface TranslationDownloadDropdownProps {
  align?: ComponentProps<typeof PopoverContent>["align"];
  className?: string;
  disabled?: boolean;
  exportingFormat?: TranslateExportFormat | null;
  label?: string;
  onDownload: (format: TranslateExportFormat) => void | Promise<void>;
}

function TranslationDownloadDropdown({
  align = "end",
  className,
  disabled = false,
  exportingFormat = null,
  label = "Tải xuống",
  onDownload,
}: TranslationDownloadDropdownProps) {
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
          size="sm"
          className={cn("min-w-30 justify-between", className)}
          disabled={disabled || isBusy}
        >
          {isBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <span>
            {isBusy ? `Đang tải ${exportingFormat?.toUpperCase()}` : label}
          </span>
          <ChevronDown className="size-4 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-44 p-1">
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

export default function AdminTranslationHistory() {
  const currentUser = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [paginationScrollKey, setPaginationScrollKey] = useState(0);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceLang, setSourceLang] = useState(ALL_LANGUAGES);
  const [targetLang, setTargetLang] = useState(ALL_LANGUAGES);
  const [exportingRecord, setExportingRecord] = useState<{
    id: string;
    format: TranslateExportFormat;
  } | null>(null);
  const [selectedRecord, setSelectedRecord] =
    useState<TranslationHistoryRecord | null>(null);
  const [draftTranslatedText, setDraftTranslatedText] = useState("");
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [isSavingTranslation, setIsSavingTranslation] = useState(false);
  const [translationView, setTranslationView] = useState<
    typeof EFFECTIVE_TRANSLATION_VIEW | typeof ORIGINAL_TRANSLATION_VIEW
  >(EFFECTIVE_TRANSLATION_VIEW);

  const historyQuery = useQuery({
    queryKey: QUERY_KEYS.translate.history.list({
      page,
      pageSize,
      fromDate,
      toDate,
      sourceLang,
      targetLang,
    }),
    queryFn: () =>
      translateApi.getTranslationHistory({
        page,
        page_size: pageSize,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        source_lang: sourceLang === ALL_LANGUAGES ? undefined : sourceLang,
        target_lang: targetLang === ALL_LANGUAGES ? undefined : targetLang,
      }),
    placeholderData: keepPreviousData,
  });

  const items = historyQuery.data?.items ?? [];
  const stats = historyQuery.data?.stats;
  const pagination = historyQuery.data?.pagination;
  const totalRecords = pagination?.total ?? stats?.total ?? 0;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);
  const paginationItems = buildPaginationItems(page, totalPages);
  const firstRecordIndex = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecordIndex = Math.min(page * pageSize, totalRecords);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const canEditTranslation =
    currentUser?.permissions.includes(EDIT_TRANSLATION_PERMISSION) ?? false;
  const selectedTranslatedText = selectedRecord
    ? getDisplayTranslatedText(selectedRecord)
    : "";
  const canViewOriginalTranslation = Boolean(
    selectedRecord?.edited_at &&
    selectedRecord.translated_text.trim() &&
    selectedRecord.translated_text !== selectedTranslatedText,
  );
  const detailTranslatedText =
    selectedRecord && translationView === ORIGINAL_TRANSLATION_VIEW
      ? selectedRecord.translated_text
      : selectedTranslatedText;
  const { targetRef: listTopRef, scrollToOffset } =
    useScrollOffset<HTMLDivElement>({
      behavior: "auto",
      enabled: paginationScrollKey > 0,
      offsetY: PAGINATION_SCROLL_OFFSET_Y,
      scrollElement: true,
      scrollKey: paginationScrollKey,
    });

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setSourceLang(ALL_LANGUAGES);
    setTargetLang(ALL_LANGUAGES);
    setPageSize(10);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);
    if (clampedPage === page) return;

    scrollToOffset();
    setPage(clampedPage);
    setPaginationScrollKey((current) => current + 1);
  };

  const copyText = async (text: string, successMessage: string) => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error("Không thể sao chép nội dung.");
    }
  };

  const downloadTranslation = async (
    itemId: string,
    translatedText: string,
    mode: TranslationHistoryMode,
    format: TranslateExportFormat,
  ) => {
    const text = translatedText.trim();
    if (!text || exportingRecord) return;

    setExportingRecord({ id: itemId, format });

    try {
      const filename = `ban-dich-${itemId.slice(0, 8)}`;
      const blob = await translateApi.exportTranslation({
        text,
        format,
        filename,
        title: getExportTitle(mode),
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
      setExportingRecord(null);
    }
  };

  const openRecordDetail = (record: TranslationHistoryRecord) => {
    setSelectedRecord(record);
    setDraftTranslatedText(getDisplayTranslatedText(record));
    setIsEditingTranslation(false);
    setTranslationView(EFFECTIVE_TRANSLATION_VIEW);
  };

  const closeRecordDetail = () => {
    setSelectedRecord(null);
    setDraftTranslatedText("");
    setIsEditingTranslation(false);
    setTranslationView(EFFECTIVE_TRANSLATION_VIEW);
  };

  const startEditingTranslation = () => {
    if (!selectedRecord) return;

    setDraftTranslatedText(getDisplayTranslatedText(selectedRecord));
    setTranslationView(EFFECTIVE_TRANSLATION_VIEW);
    setIsEditingTranslation(true);
  };

  const cancelEditingTranslation = () => {
    if (!selectedRecord || isSavingTranslation) return;

    setDraftTranslatedText(getDisplayTranslatedText(selectedRecord));
    setIsEditingTranslation(false);
  };

  const saveEditedTranslation = async () => {
    if (!selectedRecord || isSavingTranslation) return;

    const nextTranslatedText = draftTranslatedText.trim();
    const currentTranslatedText = selectedTranslatedText.trim();

    if (!nextTranslatedText) {
      toast.error("Nội dung bản dịch không được để trống.");
      return;
    }

    if (nextTranslatedText === currentTranslatedText) {
      setDraftTranslatedText(selectedTranslatedText);
      setIsEditingTranslation(false);
      return;
    }

    setIsSavingTranslation(true);

    try {
      const updatedRecord = await translateApi.updateTranslationHistory(
        selectedRecord.id,
        {
          translatedText: nextTranslatedText,
        },
      );

      setSelectedRecord((current) =>
        current?.id === updatedRecord.id ? updatedRecord : current,
      );
      setDraftTranslatedText(getDisplayTranslatedText(updatedRecord));
      setTranslationView(EFFECTIVE_TRANSLATION_VIEW);
      setIsEditingTranslation(false);
      toast.success("Đã cập nhật bản dịch.");
      await historyQuery.refetch();
    } catch (error) {
      toast.error(formatError(error));
    } finally {
      setIsSavingTranslation(false);
    }
  };

  return (
    <PageLayout
      title="Thống kê bản dịch"
      description="Theo dõi số lượt dịch và dữ liệu nguồn/dữ liệu dịch trong hệ thống"
      onRefresh={async () => {
        await historyQuery.refetch();
      }}
      titleClassName="font-playfair text-[34px] leading-[1.1] font-bold tracking-tight text-[#4b1d18] md:text-[42px]"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Languages className="size-4" />
            Tổng số lượt dịch
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {stats?.total ?? 0}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <BarChart3 className="size-4" />
            Hôm nay
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {stats?.today_count ?? 0}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Theo loại xử lý
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(stats?.by_mode ?? []).map((item) => (
              <Badge key={item.mode} variant="secondary">
                {item.mode === "SUMMARIZE" ? "Dịch tóm tắt" : "Dịch"}:{" "}
                {item.count}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Từ ngày</p>
            <TranslationHistoryDatePicker
              value={fromDate}
              onChange={(value) => {
                setFromDate(value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Đến ngày
            </p>
            <TranslationHistoryDatePicker
              value={toDate}
              onChange={(value) => {
                setToDate(value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Ngôn ngữ nguồn
            </p>
            <Select
              value={sourceLang}
              onValueChange={(value) => {
                setSourceLang(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LANGUAGES}>Tất cả</SelectItem>
                {TRANSLATION_LANGUAGES.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Ngôn ngữ dịch
            </p>
            <Select
              value={targetLang}
              onValueChange={(value) => {
                setTargetLang(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LANGUAGES}>Tất cả</SelectItem>
                {TRANSLATION_LANGUAGES.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Số dòng</p>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value) as 10 | 25 | 50);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 dòng</SelectItem>
                <SelectItem value="25">25 dòng</SelectItem>
                <SelectItem value="50">50 dòng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={resetFilters}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={listTopRef}
        className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200 bg-white shadow-sm"
      >
        {historyQuery.isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-slate-400" />
          </div>
        ) : historyQuery.isError ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <SearchX className="size-10 text-red-400" />
            <p className="text-sm font-medium text-red-600">
              Không thể tải dữ liệu dịch.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <SearchX className="size-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              Chưa có bản dịch phù hợp.
            </p>
          </div>
        ) : (
          <Table className="min-w-250 table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-slate-50">
              <TableRow>
                <TableHead className="w-37.5">Thời gian</TableHead>
                <TableHead className="w-35">Người dịch</TableHead>
                <TableHead className="w-22.5">Luồng</TableHead>
                <TableHead className="w-30">Trạng thái</TableHead>
                <TableHead className="w-40">Ngôn ngữ</TableHead>
                <TableHead className="w-24">Loại tệp</TableHead>
                <TableHead className="w-50 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => openRecordDetail(item)}
                >
                  <TableCell className="whitespace-nowrap align-top text-sm">
                    {formatDateTime(item.created_at)}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    <span className="block truncate">
                      {item.operator.username || item.operator.email || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline">
                      {item.mode === "SUMMARIZE" ? "Tóm tắt" : "Dịch"}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    {item.edited_at ? (
                      <Badge variant="secondary">Đã chỉnh sửa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">
                        Bản gốc
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="align-top text-sm">
                    <span className="block truncate">
                      {getLanguageLabel(item.source_lang)} {"->"}{" "}
                      {getLanguageLabel(item.target_lang)}
                    </span>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="secondary">
                      {getFileTypeLabel(item.source_file_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div
                      className="flex justify-end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <TranslationDownloadDropdown
                        disabled={Boolean(exportingRecord)}
                        exportingFormat={
                          exportingRecord?.id === item.id
                            ? exportingRecord.format
                            : null
                        }
                        onDownload={(format) =>
                          downloadTranslation(
                            item.id,
                            getDisplayTranslatedText(item),
                            item.mode,
                            format,
                          )
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị {firstRecordIndex}-{lastRecordIndex} / {totalRecords} bản
          dịch
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={!canGoPrevious}
                onClick={(event) => {
                  event.preventDefault();
                  if (!canGoPrevious) return;
                  handlePageChange(page - 1);
                }}
              />
            </PaginationItem>
            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={item === page}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(item);
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                disabled={!canGoNext}
                onClick={(event) => {
                  event.preventDefault();
                  if (!canGoNext) return;
                  handlePageChange(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open && !isSavingTranslation) closeRecordDetail();
        }}
      >
        <DialogContent className="max-h-[94vh] max-w-[min(98vw,1680px)] gap-4 overflow-hidden p-6">
          <DialogHeader>
            <DialogTitle>Chi tiết bản dịch</DialogTitle>
          </DialogHeader>
          {selectedRecord ? (
            <div className="grid min-h-0 gap-4 lg:grid-cols-2">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-md border bg-white">
                <div className="flex min-h-14 items-center justify-between gap-3 border-b px-4 py-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">
                      Văn bản nguồn
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedRecord.source_text.length.toLocaleString(
                        "vi-VN",
                      )}{" "}
                      ký tự
                    </p>
                  </div>
                </div>
                <div className="relative h-[68vh] min-h-[520px]">
                  <pre className="multilingual-content h-full overflow-auto whitespace-pre-wrap bg-slate-50 p-4 pb-14 text-sm text-slate-700">
                    {selectedRecord.source_text}
                  </pre>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="absolute right-4 bottom-4 bg-white/95 shadow-sm backdrop-blur hover:bg-white"
                        aria-label="Sao chép văn bản nguồn"
                        onClick={() =>
                          void copyText(
                            selectedRecord.source_text,
                            "Đã sao chép văn bản gốc.",
                          )
                        }
                      >
                        <Copy className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={8}>
                      Sao chép văn bản nguồn
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex min-h-0 flex-col overflow-hidden rounded-md border bg-white">
                <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">
                      Bản dịch
                    </p>
                    <span className="text-xs text-slate-500">
                      {detailTranslatedText.length.toLocaleString("vi-VN")} ký
                      tự
                    </span>
                    {selectedRecord.edited_at ? (
                      <Badge variant="secondary">Đã chỉnh sửa</Badge>
                    ) : null}
                    {translationView === ORIGINAL_TRANSLATION_VIEW ? (
                      <Badge variant="outline">Bản gốc</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {canEditTranslation ? (
                      isEditingTranslation ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSavingTranslation}
                            onClick={cancelEditingTranslation}
                          >
                            <X className="size-4" />
                            Hủy
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isSavingTranslation}
                            onClick={() => void saveEditedTranslation()}
                          >
                            {isSavingTranslation ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                            Lưu
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={startEditingTranslation}
                        >
                          <Pencil className="size-4" />
                          Chỉnh sửa
                        </Button>
                      )
                    ) : null}
                    <TranslationDownloadDropdown
                      disabled={
                        Boolean(exportingRecord) ||
                        isEditingTranslation ||
                        isSavingTranslation
                      }
                      exportingFormat={
                        exportingRecord?.id === selectedRecord.id
                          ? exportingRecord.format
                          : null
                      }
                      onDownload={(format) =>
                        downloadTranslation(
                          selectedRecord.id,
                          detailTranslatedText,
                          selectedRecord.mode,
                          format,
                        )
                      }
                    />
                  </div>
                </div>
                {isEditingTranslation ? (
                  <div className="h-[68vh] min-h-[520px] overflow-auto bg-slate-50 p-4">
                    <Textarea
                      autoFocus
                      rows={18}
                      value={draftTranslatedText}
                      disabled={isSavingTranslation}
                      onChange={(event) =>
                        setDraftTranslatedText(event.target.value)
                      }
                      className="multilingual-content min-h-full resize-none border-slate-200 bg-white text-sm text-slate-700 shadow-none"
                    />
                  </div>
                ) : (
                  <div className="relative h-[68vh] min-h-[520px]">
                    <pre className="multilingual-content h-full overflow-auto whitespace-pre-wrap bg-slate-50 p-4 pb-14 text-sm text-slate-700">
                      {detailTranslatedText}
                    </pre>
                    <div className="absolute right-4 bottom-4 flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="bg-white/95 shadow-sm backdrop-blur hover:bg-white"
                            disabled={isSavingTranslation}
                            aria-label="Sao chép bản dịch"
                            onClick={() =>
                              void copyText(
                                detailTranslatedText,
                                "Đã sao chép bản dịch.",
                              )
                            }
                          >
                            <Copy className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          Sao chép bản dịch
                        </TooltipContent>
                      </Tooltip>
                      {canViewOriginalTranslation ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              className="bg-white/95 shadow-sm backdrop-blur hover:bg-white"
                              disabled={isSavingTranslation}
                              aria-label={
                                translationView === ORIGINAL_TRANSLATION_VIEW
                                  ? "Quay lại bản đã chỉnh sửa"
                                  : "Xem bản dịch gốc"
                              }
                              onClick={() =>
                                setTranslationView((current) =>
                                  current === ORIGINAL_TRANSLATION_VIEW
                                    ? EFFECTIVE_TRANSLATION_VIEW
                                    : ORIGINAL_TRANSLATION_VIEW,
                                )
                              }
                            >
                              {translationView === ORIGINAL_TRANSLATION_VIEW ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {translationView === ORIGINAL_TRANSLATION_VIEW
                              ? "Quay lại bản đã chỉnh sửa"
                              : "Xem bản dịch gốc"}
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
