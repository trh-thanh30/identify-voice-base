import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AudioSegment, VoiceIdentifyTwoItem } from "../types/voice.types";
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

function getSegmentDuration(segment: AudioSegment): number {
  return segment.end - segment.start;
}

function getLongestSegment(
  item?: VoiceIdentifyTwoItem | null,
): AudioSegment | undefined {
  if (!item?.audio_segment?.length) return undefined;

  return [...item.audio_segment].sort(
    (a, b) => getSegmentDuration(b) - getSegmentDuration(a),
  )[0];
}

function getSourceFileKey(file: File | null) {
  if (!file) return "no-file";
  return `${file.name}-${file.size}-${file.lastModified}`;
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
  const longestSegment = useMemo(
    () => getLongestSegment(speakerItem),
    [speakerItem],
  );

  const [selectedSegment, setSelectedSegment] = useState<
    AudioSegment | undefined
  >(undefined);

  const [playerKey, setPlayerKey] = useState(0);

  // Use longest segment if no user selection
  const effectiveSegment = selectedSegment ?? longestSegment;

  // Only use file-based key for form, not segment-based (to prevent form reset when changing segment)
  const formKey = [
    speakerItem?.matched_voice_id ?? "new",
    getSourceFileKey(sourceFile),
  ].join("-");

  const handleSegmentClick = (segment: AudioSegment) => {
    setSelectedSegment(segment);
    setPlayerKey((prev) => prev + 1);
  };

  const segments = speakerItem?.audio_segment ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw]! max-w-[96vw]! h-[92vh] overflow-hidden p-0 sm:max-w-5xl! xl:max-w-6xl!">
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

              {segments.length > 0 ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">Timestamp speaker</p>
                  <div className="flex flex-wrap gap-2">
                    {segments.map((segment, index) => {
                      const isSelected =
                        effectiveSegment?.start === segment.start &&
                        effectiveSegment?.end === segment.end;
                      return (
                        <button
                          key={`${segment.start}-${segment.end}-${index}`}
                          type="button"
                          onClick={() => handleSegmentClick(segment)}
                          className={cn(
                            "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected
                              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                          )}
                        >
                          {formatSeconds(segment.start)} -{" "}
                          {formatSeconds(segment.end)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <VoiceUploadForm
                key={formKey}
                playerKey={playerKey}
                initialFile={sourceFile}
                initialStart={effectiveSegment?.start}
                initialEnd={effectiveSegment?.end}
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
