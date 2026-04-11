import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { VoiceIdentifyTwoItem } from "../types/voice.types";
import { VoiceUploadForm } from "./voice-upload-form";

interface VoiceEnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceFile: File | null;
  speakerItem?: VoiceIdentifyTwoItem | null;
  onEnrollSuccess?: (data: VoiceIdentifyTwoItem) => void;
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getLongestSegment(item?: VoiceIdentifyTwoItem | null) {
  if (!item?.audio_segment?.length) return undefined;

  return [...item.audio_segment].sort(
    (a, b) => b.end - b.start - (a.end - a.start),
  )[0];
}

function getSourceFileKey(file: File | null) {
  if (!file) return "no-file";
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function VoiceEnrollDialog({
  open,
  onOpenChange,
  sourceFile,
  speakerItem,
  onEnrollSuccess,
}: VoiceEnrollDialogProps) {
  const longestSegment = getLongestSegment(speakerItem);
  const formKey = [
    speakerItem?.matched_voice_id ?? "new",
    getSourceFileKey(sourceFile),
    longestSegment?.start ?? "na",
    longestSegment?.end ?? "na",
  ].join("-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[96vw] !max-w-[96vw] h-[92vh] overflow-hidden p-0 sm:!max-w-5xl xl:!max-w-6xl">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
            <DialogTitle>Đăng ký giọng nói</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="min-w-0 space-y-4">
              {sourceFile ? (
                <div className="break-all rounded-lg border p-3 text-sm text-muted-foreground">
                  File nguồn:{" "}
                  <span className="font-medium text-foreground">
                    {sourceFile.name}
                  </span>
                </div>
              ) : null}

              {speakerItem?.audio_segment?.length ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">Timestamp speaker</p>
                  <div className="flex flex-wrap gap-2">
                    {speakerItem.audio_segment.map((segment, index) => (
                      <Badge
                        key={`${segment.start}-${segment.end}-${index}`}
                        variant="secondary"
                      >
                        {formatSeconds(segment.start)} -{" "}
                        {formatSeconds(segment.end)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              <VoiceUploadForm
                key={formKey}
                initialFile={sourceFile}
                initialStart={longestSegment?.start}
                initialEnd={longestSegment?.end}
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
