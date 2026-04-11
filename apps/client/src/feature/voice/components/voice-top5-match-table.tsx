import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VoiceIdentifyItem } from "../types/voice.types";
import { getVoiceScoreMeta } from "../utils/voice-score";

interface VoiceTop5MatchTableProps {
  title: string;
  description?: string;
  items: VoiceIdentifyItem[];
  emptyText?: string;
  speakerIndex?: number;
}

interface PlayingAudioState {
  rowIndex: number;
  audioUrl: string;
}

function getItemAudioUrl(item: VoiceIdentifyItem) {
  return item.enroll_audio_url || item.audio_url || undefined;
}

export function VoiceTop5MatchTable({
  title,
  description,
  items,
  emptyText = "Khong co du lieu.",
  speakerIndex = 0,
}: VoiceTop5MatchTableProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudio, setPlayingAudio] = useState<PlayingAudioState | null>(
    null,
  );
  const audioSources = items.map(getItemAudioUrl);
  const audioSourcesKey = audioSources.map((value) => value ?? "").join("|");
  const shouldShowAudioColumn = items.length > 0;
  const activeAudioUrl =
    playingAudio !== null ? audioSources[playingAudio.rowIndex] : undefined;
  const playingRowIndex =
    playingAudio && playingAudio.audioUrl === activeAudioUrl
      ? playingAudio.rowIndex
      : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePause = () => setPlayingAudio(null);
    const handleEnded = () => setPlayingAudio(null);

    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }, [audioSourcesKey]);

  const handleToggleAudio = async (rowIndex: number) => {
    const audio = audioRef.current;
    const rowAudioUrl = audioSources[rowIndex];
    if (!audio || !rowAudioUrl) return;

    if (playingRowIndex === rowIndex && !audio.paused) {
      audio.pause();
      return;
    }

    if (audio.src !== rowAudioUrl) {
      audio.src = rowAudioUrl;
      audio.load();
    }

    try {
      await audio.play();
      setPlayingAudio({ rowIndex, audioUrl: rowAudioUrl });
    } catch {
      setPlayingAudio(null);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <>
            {shouldShowAudioColumn ? (
              <audio ref={audioRef} preload="none" className="hidden" />
            ) : null}

            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-1 text-center">STT</TableHead>
                  {shouldShowAudioColumn ? (
                    <TableHead className="w-16 px-1 text-center">
                      Audio
                    </TableHead>
                  ) : null}
                  <TableHead className="w-[20rem] pl-2">Ho va ten</TableHead>
                  <TableHead className="w-40 text-center">CCCD</TableHead>
                  <TableHead className="w-32 text-center">Dien thoai</TableHead>
                  <TableHead className="w-40 text-center">Diem so</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const rowAudioUrl = audioSources[index];
                  const scoreMeta = getVoiceScoreMeta(item.score);

                  return (
                    <TableRow
                      key={`speaker-${speakerIndex}-match-${
                        item.matched_voice_id || item.name || "unknown"
                      }-${index}`}
                    >
                      <TableCell className="w-12 px-1 text-center">
                        {index + 1}
                      </TableCell>
                      {shouldShowAudioColumn ? (
                        <TableCell className="w-16 px-1 text-center">
                          {rowAudioUrl ? (
                            <Button
                              type="button"
                              size="icon-sm"
                              className="mx-auto size-8 rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700"
                              onClick={() => void handleToggleAudio(index)}
                              aria-label={
                                playingRowIndex === index
                                  ? "Tam dung audio"
                                  : "Phat audio"
                              }
                              title={
                                playingRowIndex === index
                                  ? "Tam dung audio"
                                  : "Phat audio"
                              }
                            >
                              {playingRowIndex === index ? (
                                <Pause className="size-3.5" />
                              ) : (
                                <Play className="size-3.5" />
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell className="max-w-[20rem] pl-2 font-medium">
                        <div className="truncate" title={item.name || "-"}>
                          {item.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.citizen_identification || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.phone_number || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`mx-auto border ${scoreMeta.badgeClassName}`}
                        >
                          {typeof item.score === "number"
                            ? item.score.toFixed(4)
                            : "-"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
