import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import WaveSurfer from "wavesurfer.js";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VoiceAudioPlayerProps {
  file: File | null;
  title?: string;
  startAt?: number;
  endAt?: number;
  onReady?: () => void;
  footerAction?: ReactNode;
  footerActionWrapperClassName?: string;
}

const WAVEFORM_FALLBACK_MESSAGE =
  "Khong the tai waveform cho file audio nay. Ban van co the phat bang trinh phat mac dinh ben duoi.";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function VoiceAudioPlayer({
  file,
  title = "Audio player",
  startAt,
  endAt,
  onReady,
  footerAction,
  footerActionWrapperClassName,
}: VoiceAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const stopTimerRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!containerRef.current || !file) {
      return;
    }

    let isDisposed = false;
    let frameId: number | null = null;
    let waveSurfer: WaveSurfer | null = null;

    frameId = window.requestAnimationFrame(() => {
      if (!containerRef.current || isDisposed) {
        return;
      }

      waveSurfer = WaveSurfer.create({
        container: containerRef.current,
        height: 96,
        waveColor: "#cbd5e1",
        progressColor: "#0f172a",
        cursorColor: "#ef4444",
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        dragToSeek: true,
        backend: "MediaElement",
      });

      waveSurferRef.current = waveSurfer;

      waveSurfer.on("ready", () => {
        if (isDisposed || !waveSurfer) return;

        setAudioError(null);
        setIsReady(true);
        setDuration(waveSurfer.getDuration());
        onReady?.();
      });

      waveSurfer.on("play", () => {
        if (!isDisposed) {
          setIsPlaying(true);
        }
      });

      waveSurfer.on("pause", () => {
        if (!isDisposed) {
          setIsPlaying(false);
        }
      });

      waveSurfer.on("finish", () => {
        if (!isDisposed) {
          setIsPlaying(false);
        }
      });

      waveSurfer.on("timeupdate", (time) => {
        if (!isDisposed) {
          setCurrentTime(time);
        }
      });

      waveSurfer.on("error", (error) => {
        if (isDisposed) return;

        setAudioError(error.message || WAVEFORM_FALLBACK_MESSAGE);
        setIsReady(false);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      });

      void waveSurfer.loadBlob(file).catch((error) => {
        if (isDisposed) return;

        setAudioError(
          error instanceof Error && error.message
            ? error.message
            : WAVEFORM_FALLBACK_MESSAGE,
        );
        setIsReady(false);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      });
    });

    return () => {
      isDisposed = true;

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }

      waveSurfer?.destroy();
      waveSurferRef.current = null;
      setAudioError(null);
      setIsReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    };
  }, [file, onReady]);

  useEffect(() => {
    const wave = waveSurferRef.current;
    if (!wave || !isReady) return;
    if (typeof startAt !== "number" || !Number.isFinite(startAt)) return;

    wave.setTime(startAt);

    if (
      typeof endAt === "number" &&
      Number.isFinite(endAt) &&
      endAt > startAt
    ) {
      void wave.play();

      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
      }

      stopTimerRef.current = window.setTimeout(
        () => {
          wave.pause();
        },
        (endAt - startAt) * 1000,
      );
    }
  }, [startAt, endAt, isReady]);

  const togglePlay = async () => {
    const wave = waveSurferRef.current;
    if (!wave || !isReady) return;

    if (wave.isPlaying()) {
      wave.pause();
      return;
    }

    try {
      await wave.play();
    } catch (error) {
      setAudioError(
        error instanceof Error && error.message
          ? error.message
          : WAVEFORM_FALLBACK_MESSAGE,
      );
    }
  };

  if (!file) return null;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-background p-3">
          <div
            ref={containerRef}
            className={cn("w-full", audioError && "hidden")}
          />

          {audioError && audioUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {WAVEFORM_FALLBACK_MESSAGE}
              </p>
              <audio
                controls
                preload="metadata"
                src={audioUrl}
                className="w-full"
              />
            </div>
          ) : null}
        </div>

        {!audioError ? (
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={togglePlay}
              disabled={!isReady}
            >
              {isPlaying ? (
                <>
                  <Pause className="mr-2 size-4" />
                  Tạm dừng
                </>
              ) : (
                <>
                  <Play className="mr-2 size-4" />
                  Phát
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {file.name}
            </div>
          </div>
        ) : (
          <div className="min-w-0 truncate text-sm text-muted-foreground">
            {file.name}
          </div>
        )}

        {footerAction ? (
          <div className={cn("flex justify-end", footerActionWrapperClassName)}>
            {footerAction}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
