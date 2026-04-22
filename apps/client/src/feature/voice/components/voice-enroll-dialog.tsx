import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMemo } from "react";
import type { UploadVoiceSchemaInput } from "../schemas/voice.schema";
import type { CriminalRecordItem } from "../types/voice.types";
import type { VoiceIdentifyTwoItem } from "../types/voice.types";
import { VoiceUploadForm } from "./voice-upload-form";

interface VoiceEnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceFile: File | null;
  speakerItem?: VoiceIdentifyTwoItem | null;
  onEnrollSuccess?: (data: VoiceIdentifyTwoItem) => void;
}

function getSourceFileKey(file: File | null) {
  if (!file) return "no-file";
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function getPreviewAudioUrl(
  item?: VoiceIdentifyTwoItem | null,
): string | undefined {
  return item?.audio_url?.trim() || undefined;
}

function isCriminalRecordItem(value: unknown): value is CriminalRecordItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "case" in value &&
    "year" in value &&
    typeof value.case === "string" &&
    typeof value.year === "number"
  );
}

function getInitialFormValues(
  item?: VoiceIdentifyTwoItem | null,
): Partial<UploadVoiceSchemaInput> {
  return {
    name: item?.name?.trim() ?? "",
    citizenIdentification: item?.citizen_identification?.trim() ?? "",
    phoneNumber: item?.phone_number?.trim() ?? "",
    hometown: item?.hometown?.trim() ?? "",
    job: item?.job?.trim() ?? "",
    passport: item?.passport?.trim() ?? "",
    age: typeof item?.age === "number" && item.age > 0 ? String(item.age) : "",
    gender:
      item?.gender === "MALE" || item?.gender === "FEMALE" ? item.gender : "",
    criminalRecords: Array.isArray(item?.criminal_record)
      ? item.criminal_record.filter(isCriminalRecordItem).map((record) => {
          const criminalRecord = record as CriminalRecordItem;
          return {
            case: criminalRecord.case,
            year: String(criminalRecord.year),
          };
        })
      : [],
  };
}

interface VoiceEnrollDialogContentProps {
  open: boolean;
  sourceFile: File | null;
  speakerItem?: VoiceIdentifyTwoItem | null;
  onEnrollSuccess?: (data: VoiceIdentifyTwoItem) => void;
  onOpenChange: (open: boolean) => void;
}

function VoiceEnrollDialogContent({
  open,
  sourceFile,
  speakerItem,
  onEnrollSuccess,
  onOpenChange,
}: VoiceEnrollDialogContentProps) {
  const previewAudioUrl = useMemo(
    () => getPreviewAudioUrl(speakerItem),
    [speakerItem],
  );
  const initialFormValues = useMemo(
    () => getInitialFormValues(speakerItem),
    [speakerItem],
  );

  // Only use file-based key for form, not segment-based (to prevent form reset when changing segment)
  const formKey = [
    speakerItem?.matched_voice_id ?? "new",
    getSourceFileKey(sourceFile),
  ].join("-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92vh] overflow-hidden p-0 sm:max-w-5xl xl:max-w-6xl">
        <div className="flex h-full min-h-0 flex-col min-w-0">
          <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
            <DialogTitle>Đăng ký giọng nói</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="min-w-0 space-y-4 ">
              <VoiceUploadForm
                key={formKey}
                initialFile={sourceFile}
                previewAudioUrl={previewAudioUrl}
                initialValues={initialFormValues}
                compact
                onUploadSuccess={(data) => {
                  if (data) {
                    onEnrollSuccess?.({
                      ...speakerItem,
                      ...data,
                    } as VoiceIdentifyTwoItem);
                  }

                  onOpenChange(false);
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VoiceEnrollDialog({
  open,
  onOpenChange,
  sourceFile,
  speakerItem,
  onEnrollSuccess,
}: VoiceEnrollDialogProps) {
  // Use key to force VoiceEnrollDialogContent to remount when speaker changes
  const contentKey = speakerItem?.matched_voice_id ?? "no-speaker";

  return (
    <VoiceEnrollDialogContent
      key={contentKey}
      open={open}
      sourceFile={sourceFile}
      speakerItem={speakerItem}
      onEnrollSuccess={onEnrollSuccess}
      onOpenChange={onOpenChange}
    />
  );
}
