import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatError } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, AudioLines, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { voiceApi } from "../api/voice.api";
import { VoiceAudioPlayer } from "./voice-audio-player";

interface VoiceFilterNoiseDialogProps {
  sourceFile: File | null;
  onSelectAudio: (file: File) => void;
}

export function VoiceFilterNoiseDialog({
  sourceFile,
  onSelectAudio,
}: VoiceFilterNoiseDialogProps) {
  const [open, setOpen] = useState(false);
  const [filteredAudioFile, setFilteredAudioFile] = useState<File | null>(null);
  const filterAbortRef = useRef<AbortController | null>(null);

  const filterNoiseMutation = useMutation({
    mutationFn: async (file: File) => {
      filterAbortRef.current?.abort();
      const controller = new AbortController();
      filterAbortRef.current = controller;

      return voiceApi.filterNoise(file, controller.signal);
    },
    onSuccess: (file) => {
      setFilteredAudioFile(file);
    },
    onError: (error) => {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "CanceledError"
      ) {
        return;
      }

      toast.error(formatError(error));
    },
    onSettled: () => {
      filterAbortRef.current = null;
    },
  });

  const handleOpenDialog = () => {
    if (!sourceFile || filterNoiseMutation.isPending) {
      return;
    }

    setOpen(true);
    setFilteredAudioFile(null);
    filterNoiseMutation.mutate(sourceFile);
  };

  const handleUseSourceAudio = () => {
    if (!sourceFile) {
      return;
    }

    filterAbortRef.current?.abort();
    onSelectAudio(sourceFile);
    setOpen(false);
  };

  const handleUseFilteredAudio = () => {
    if (!filteredAudioFile) {
      return;
    }

    onSelectAudio(filteredAudioFile);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      filterAbortRef.current?.abort();
    }

    setOpen(nextOpen);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="shadow-md hover:shadow-lg"
        disabled={!sourceFile || filterNoiseMutation.isPending}
        onClick={handleOpenDialog}
      >
        {filterNoiseMutation.isPending ? (
          <>
            <LoaderCircle className="mr-2 size-4 animate-spin" />
            Đang lọc audio...
          </>
        ) : (
          <>
            <AudioLines className="mr-2 size-4" />
            Lọc audio
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Lọc audio</DialogTitle>
          </DialogHeader>

          <div className="relative grid gap-6 lg:gap-12 lg:grid-cols-2">
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden -translate-x-1/2 lg:flex items-center justify-center">
              <ArrowRight className="size-8 text-muted-foreground/80" />
            </div>

            <div className="space-y-4">
              <div className="space-y-4 rounded-2xl border p-4">
                <div>
                  <p className="font-medium">Audio gốc</p>
                </div>
                <VoiceAudioPlayer file={sourceFile} title="Audio gốc" compact />
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseSourceAudio}
                >
                  Dùng audio gốc
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4 rounded-2xl border p-4">
                <div>
                  <p className="font-medium">Audio đã lọc ồn</p>
                </div>

                {filterNoiseMutation.isPending ? (
                  <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    Đang lọc audio...
                  </div>
                ) : filteredAudioFile ? (
                  <VoiceAudioPlayer
                    file={filteredAudioFile}
                    title="Audio đã lọc"
                    compact
                  />
                ) : (
                  <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-muted-foreground">
                    {filterNoiseMutation.isError
                      ? "Không thể tạo audio đã lọc. Bạn có thể đóng dialog và thử lại."
                      : "Chưa có audio đã lọc để phát."}
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  disabled={!filteredAudioFile || filterNoiseMutation.isPending}
                  onClick={handleUseFilteredAudio}
                >
                  Dùng audio đã lọc
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
