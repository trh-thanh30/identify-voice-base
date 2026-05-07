import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Search } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { voiceApi } from "../api/voice.api";
import { useIdentifyVoice } from "../hooks/use-voice";
import {
  identifyVoiceSchema,
  type IdentifyVoiceSchemaInput,
  type IdentifyVoiceSchemaOutput,
} from "../schemas/voice.schema";
import { VoiceAudioDropzone } from "./voice-audio-dropzone";

interface VoiceSingleSearchFormProps {
  formId?: string;
  onFileSelected?: (file: File | null) => void;
  onPendingChange?: (pending: boolean) => void;
  showSubmitButton?: boolean;
  autoSubmitOnAudioChange?: boolean;
}

export interface VoiceSingleSearchFormHandle {
  replaceAudioFile: (
    file: File | null,
    options?: {
      suppressAutoSubmit?: boolean;
    },
  ) => void;
  submitCurrent: () => void;
}

function getAudioFileKey(file: File | null) {
  if (!file) return null;
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export const VoiceSingleSearchForm = forwardRef<
  VoiceSingleSearchFormHandle,
  VoiceSingleSearchFormProps
>(function VoiceSingleSearchForm(
  {
    formId,
    onFileSelected,
    onPendingChange,
    showSubmitButton = true,
    autoSubmitOnAudioChange = false,
  },
  ref,
) {
  const identifyMutation = useIdentifyVoice();
  const lastAutoSubmittedFileKeyRef = useRef<string | null>(null);
  const [isNormalizingAudio, setIsNormalizingAudio] = useState(false);

  const form = useForm<
    IdentifyVoiceSchemaInput,
    unknown,
    IdentifyVoiceSchemaOutput
  >({
    resolver: zodResolver(identifyVoiceSchema),
    defaultValues: {
      audioFile: null,
    },
  });
  const audioFile = form.watch("audioFile");

  const applyAudioFile = useCallback(
    (
      file: File | null,
      options?: {
        suppressAutoSubmit?: boolean;
        shouldTouch?: boolean;
      },
    ) => {
      const fileKey = getAudioFileKey(file);

      if (options?.suppressAutoSubmit) {
        lastAutoSubmittedFileKeyRef.current = fileKey;
      } else if (!fileKey) {
        lastAutoSubmittedFileKeyRef.current = null;
      }

      form.setValue("audioFile", file, {
        shouldDirty: true,
        shouldTouch: options?.shouldTouch ?? true,
        shouldValidate: true,
      });
    },
    [form],
  );

  useEffect(() => {
    onPendingChange?.(identifyMutation.isPending || isNormalizingAudio);

    return () => {
      onPendingChange?.(false);
    };
  }, [identifyMutation.isPending, isNormalizingAudio, onPendingChange]);

  const normalizeAndSetAudioFile = async (file: File | null) => {
    if (!file) {
      applyAudioFile(null, { shouldTouch: false });
      onFileSelected?.(null);
      return;
    }

    setIsNormalizingAudio(true);
    onFileSelected?.(null);
    const toastId = toast.loading("Đang chuẩn hóa audio về WAV 16kHz mono...");

    try {
      const normalizedFile = await voiceApi.normalizeAudio(file);
      applyAudioFile(normalizedFile);
      onFileSelected?.(normalizedFile);
      toast.success("Đã chuẩn hóa audio.", { id: toastId });
    } catch {
      applyAudioFile(null, { shouldTouch: false });
      onFileSelected?.(null);
      toast.error("Không thể chuẩn hóa audio. Vui lòng kiểm tra file gốc.", {
        id: toastId,
      });
    } finally {
      setIsNormalizingAudio(false);
    }
  };

  const onSubmit = useCallback<SubmitHandler<IdentifyVoiceSchemaOutput>>(
    async (values) => {
      await identifyMutation.mutateAsync(values);
    },
    [identifyMutation],
  );

  useImperativeHandle(
    ref,
    () => ({
      replaceAudioFile: (file, options) => {
        applyAudioFile(file, {
          suppressAutoSubmit: options?.suppressAutoSubmit,
        });
      },
      submitCurrent: () => {
        void form.handleSubmit(onSubmit)();
      },
    }),
    [applyAudioFile, form, onSubmit],
  );

  useEffect(() => {
    const fileKey = getAudioFileKey(audioFile);

    if (!fileKey) {
      lastAutoSubmittedFileKeyRef.current = null;
      return;
    }

    if (
      !autoSubmitOnAudioChange ||
      identifyMutation.isPending ||
      isNormalizingAudio ||
      lastAutoSubmittedFileKeyRef.current === fileKey
    ) {
      return;
    }

    lastAutoSubmittedFileKeyRef.current = fileKey;
    void form.handleSubmit(onSubmit)();
  }, [
    audioFile,
    autoSubmitOnAudioChange,
    form,
    identifyMutation.isPending,
    isNormalizingAudio,
    onSubmit,
  ]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Tra cứu 1 người</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            id={formId}
            className="space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="audioFile"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>File audio</FormLabel>
                  <FormControl>
                    <VoiceAudioDropzone
                      value={field.value ?? null}
                      onChange={(file) => {
                        void normalizeAndSetAudioFile(file);
                      }}
                      disabled={
                        identifyMutation.isPending || isNormalizingAudio
                      }
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showSubmitButton && audioFile ? (
              <Button
                type="submit"
                disabled={identifyMutation.isPending || isNormalizingAudio}
              >
                {identifyMutation.isPending || isNormalizingAudio ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    {isNormalizingAudio
                      ? "Đang chuẩn hóa..."
                      : "Đang tra cứu..."}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 size-4" />
                    Tra cứu 1 người
                  </>
                )}
              </Button>
            ) : null}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});
