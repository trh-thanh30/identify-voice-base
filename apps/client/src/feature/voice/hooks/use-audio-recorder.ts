import { useCallback, useEffect, useRef, useState } from "react";
import { convertAudioFileToWav } from "@/utils/audio.utils";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<File | null>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveStopRef = useRef<((file: File | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      chunksRef.current = [];
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        void (async () => {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const sourceMimeType = mediaRecorder.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: sourceMimeType });
          const sourceFile = new File([blob], `recording-${timestamp}.webm`, {
            type: sourceMimeType,
          });

          let outputFile: File = sourceFile;

          try {
            outputFile = await convertAudioFileToWav(
              sourceFile,
              `recording-${timestamp}`,
            );
          } catch (error) {
            console.error("Failed to convert recorded audio to wav:", error);
          }

          if (resolveStopRef.current) {
            resolveStopRef.current(outputFile);
            resolveStopRef.current = null;
          }

          chunksRef.current = [];
          mediaRecorderRef.current = null;
        })();
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      cleanup();
      throw error;
    }
  }, [cleanup]);

  const stopRecording = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === "inactive"
      ) {
        resolve(null);
        return;
      }

      resolveStopRef.current = resolve;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    });
  }, []);

  return { isRecording, duration, startRecording, stopRecording };
}
