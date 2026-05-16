import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageLayout } from "@/components/PageLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QUERY_KEYS } from "@/constants";
import type { TranslateExportFormat } from "@/feature/translate/api/translate.api";
import { translateApi } from "@/feature/translate/api/translate.api";
import {
  ALL_TRANSLATION_LANGUAGES_FILTER,
  EFFECTIVE_TRANSLATION_VIEW,
  ORIGINAL_TRANSLATION_VIEW,
  SourceTextPanel,
  TranslatedTextPanel,
  TranslationHistoryFilters,
  TranslationHistoryPagination,
  TranslationHistoryTable,
  TranslationStatsCards,
  type TranslationView,
} from "@/feature/translate/components/admin-translation-history-content";
import type {
  TranslationHistoryMode,
  TranslationHistoryRecord,
} from "@/feature/translate/types/translate.types";
import {
  buildPaginationItems,
  getExportTitle,
} from "@/feature/translate/utils/translation-history.utils";
import { useScrollOffset } from "@/hooks/use-scroll-offset";
import { useAuthStore } from "@/store/auth.store";
import { formatError } from "@/utils";

const EDIT_TRANSLATION_PERMISSION = "translate.history.update";
const PAGINATION_SCROLL_OFFSET_Y = 128;

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

export default function AdminTranslationHistory() {
  const currentUser = useAuthStore((state) => state.user);
  const recordDetailTitleRef = useRef<HTMLHeadingElement | null>(null);
  const [page, setPage] = useState(1);
  const [paginationScrollKey, setPaginationScrollKey] = useState(0);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceLang, setSourceLang] = useState(
    ALL_TRANSLATION_LANGUAGES_FILTER,
  );
  const [targetLang, setTargetLang] = useState(
    ALL_TRANSLATION_LANGUAGES_FILTER,
  );
  const [exportingRecord, setExportingRecord] = useState<{
    id: string;
    format: TranslateExportFormat;
  } | null>(null);
  const [selectedRecord, setSelectedRecord] =
    useState<TranslationHistoryRecord | null>(null);
  const [draftTranslatedText, setDraftTranslatedText] = useState("");
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [isSavingTranslation, setIsSavingTranslation] = useState(false);
  const [isRecordDetailContentReady, setIsRecordDetailContentReady] =
    useState(false);
  const [translationView, setTranslationView] = useState<TranslationView>(
    EFFECTIVE_TRANSLATION_VIEW,
  );
  const [isTranslationViewTooltipOpen, setIsTranslationViewTooltipOpen] =
    useState(false);
  const [
    isTranslationViewTooltipSuppressed,
    setIsTranslationViewTooltipSuppressed,
  ] = useState(false);

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
        source_lang:
          sourceLang === ALL_TRANSLATION_LANGUAGES_FILTER
            ? undefined
            : sourceLang,
        target_lang:
          targetLang === ALL_TRANSLATION_LANGUAGES_FILTER
            ? undefined
            : targetLang,
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
  const isRecordDetailContentLoading = Boolean(
    selectedRecord && !isRecordDetailContentReady,
  );
  const { targetRef: listTopRef, scrollToOffset } =
    useScrollOffset<HTMLDivElement>({
      behavior: "auto",
      enabled: paginationScrollKey > 0,
      offsetY: PAGINATION_SCROLL_OFFSET_Y,
      scrollElement: true,
      scrollKey: paginationScrollKey,
    });

  useEffect(() => {
    if (!selectedRecord) return;

    let isDisposed = false;
    setIsRecordDetailContentReady(false);

    const fontReadyPromise =
      "fonts" in document
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve();
    const fallbackDelayPromise = new Promise((resolve) => {
      window.setTimeout(resolve, 320);
    });

    void Promise.race([fontReadyPromise, fallbackDelayPromise]).then(() => {
      window.requestAnimationFrame(() => {
        if (!isDisposed) {
          setIsRecordDetailContentReady(true);
        }
      });
    });

    return () => {
      isDisposed = true;
    };
  }, [selectedRecord]);

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setSourceLang(ALL_TRANSLATION_LANGUAGES_FILTER);
    setTargetLang(ALL_TRANSLATION_LANGUAGES_FILTER);
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
    if (!text.trim()) return false;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      return true;
    } catch {
      toast.error("Không thể sao chép nội dung.");
      return false;
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
    setIsRecordDetailContentReady(false);
    setSelectedRecord(record);
    setDraftTranslatedText(getDisplayTranslatedText(record));
    setIsEditingTranslation(false);
    setTranslationView(EFFECTIVE_TRANSLATION_VIEW);
    setIsTranslationViewTooltipOpen(false);
    setIsTranslationViewTooltipSuppressed(false);
  };

  const closeRecordDetail = () => {
    setSelectedRecord(null);
    setDraftTranslatedText("");
    setIsEditingTranslation(false);
    setIsRecordDetailContentReady(false);
    setTranslationView(EFFECTIVE_TRANSLATION_VIEW);
    setIsTranslationViewTooltipOpen(false);
    setIsTranslationViewTooltipSuppressed(false);
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

  const toggleTranslationView = () => {
    const nextView =
      translationView === ORIGINAL_TRANSLATION_VIEW
        ? EFFECTIVE_TRANSLATION_VIEW
        : ORIGINAL_TRANSLATION_VIEW;

    setIsTranslationViewTooltipSuppressed(true);
    setIsTranslationViewTooltipOpen(false);
    setTranslationView(nextView);
    toast.success(
      nextView === ORIGINAL_TRANSLATION_VIEW
        ? "Đang xem bản dịch gốc."
        : "Đang xem bản đã chỉnh sửa.",
    );
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
      <TranslationStatsCards stats={stats} />

      <TranslationHistoryFilters
        fromDate={fromDate}
        onFromDateChange={(value) => {
          setFromDate(value);
          setPage(1);
        }}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        onReset={resetFilters}
        onSourceLangChange={(value) => {
          setSourceLang(value);
          setPage(1);
        }}
        onTargetLangChange={(value) => {
          setTargetLang(value);
          setPage(1);
        }}
        onToDateChange={(value) => {
          setToDate(value);
          setPage(1);
        }}
        pageSize={pageSize}
        sourceLang={sourceLang}
        targetLang={targetLang}
        toDate={toDate}
      />

      <div
        ref={listTopRef}
        className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200 bg-white shadow-sm"
      >
        <TranslationHistoryTable
          exportingRecord={exportingRecord}
          isError={historyQuery.isError}
          isLoading={historyQuery.isLoading}
          items={items}
          onDownload={(record, format) =>
            downloadTranslation(
              record.id,
              getDisplayTranslatedText(record),
              record.mode,
              format,
            )
          }
          onOpenRecord={openRecordDetail}
        />
      </div>

      <TranslationHistoryPagination
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        firstRecordIndex={firstRecordIndex}
        lastRecordIndex={lastRecordIndex}
        onPageChange={handlePageChange}
        page={page}
        paginationItems={paginationItems}
        totalRecords={totalRecords}
      />

      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open && !isSavingTranslation) closeRecordDetail();
        }}
      >
        <DialogContent
          className="max-h-[94vh] max-w-[min(98vw,1680px)] gap-4 overflow-hidden p-6"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            recordDetailTitleRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle ref={recordDetailTitleRef} tabIndex={-1}>
              Chi tiết bản dịch
            </DialogTitle>
          </DialogHeader>
          {selectedRecord ? (
            <div className="grid min-h-0 gap-4 lg:grid-cols-2">
              <SourceTextPanel
                isContentLoading={isRecordDetailContentLoading}
                onCopy={copyText}
                record={selectedRecord}
              />
              <TranslatedTextPanel
                canEditTranslation={canEditTranslation}
                canViewOriginalTranslation={canViewOriginalTranslation}
                detailTranslatedText={detailTranslatedText}
                draftTranslatedText={draftTranslatedText}
                exportingFormat={
                  exportingRecord?.id === selectedRecord.id
                    ? exportingRecord.format
                    : null
                }
                isContentLoading={isRecordDetailContentLoading}
                isEditingTranslation={isEditingTranslation}
                isSavingTranslation={isSavingTranslation}
                isViewTooltipOpen={isTranslationViewTooltipOpen}
                isViewTooltipSuppressed={isTranslationViewTooltipSuppressed}
                onCancelEditing={cancelEditingTranslation}
                onCopy={copyText}
                onDownload={(format) =>
                  downloadTranslation(
                    selectedRecord.id,
                    detailTranslatedText,
                    selectedRecord.mode,
                    format,
                  )
                }
                onDraftChange={setDraftTranslatedText}
                onSaveEditing={() => void saveEditedTranslation()}
                onStartEditing={startEditingTranslation}
                onToggleView={toggleTranslationView}
                onViewTooltipOpenChange={setIsTranslationViewTooltipOpen}
                onViewTooltipSuppressChange={
                  setIsTranslationViewTooltipSuppressed
                }
                record={selectedRecord}
                translationView={translationView}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
