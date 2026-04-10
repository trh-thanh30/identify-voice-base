import { useCallback, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { LoaderCircle, Search } from "lucide-react";
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
import {
  identifyVoiceSchema,
  type IdentifyVoiceSchemaInput,
  type IdentifyVoiceSchemaOutput,
} from "../schemas/voice.schema";
import { useIdentifyVoice } from "../hooks/use-voice";
import { VoiceAudioDropzone } from "./voice-audio-dropzone";

interface VoiceSingleSearchFormProps {
  formId?: string;
  onFileSelected?: (file: File | null) => void;
  onPendingChange?: (pending: boolean) => void;
  showSubmitButton?: boolean;
  autoSubmitOnAudioChange?: boolean;
}

function getAudioFileKey(file: File | null) {
  if (!file) return null;
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function VoiceSingleSearchForm({
  formId,
  onFileSelected,
  onPendingChange,
  showSubmitButton = true,
  autoSubmitOnAudioChange = false,
}: VoiceSingleSearchFormProps) {
  const identifyMutation = useIdentifyVoice();
  const lastAutoSubmittedFileKeyRef = useRef<string | null>(null);

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

  useEffect(() => {
    onPendingChange?.(identifyMutation.isPending);

    return () => {
      onPendingChange?.(false);
    };
  }, [identifyMutation.isPending, onPendingChange]);

  const onSubmit = useCallback<SubmitHandler<IdentifyVoiceSchemaOutput>>(
    async (values) => {
      onFileSelected?.(values.audioFile);
      await identifyMutation.mutateAsync(values);
    },
    [identifyMutation, onFileSelected],
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
                        field.onChange(file);
                        onFileSelected?.(file);
                      }}
                      disabled={identifyMutation.isPending}
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showSubmitButton && audioFile ? (
              <Button type="submit" disabled={identifyMutation.isPending}>
                {identifyMutation.isPending ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    Đang tra cứu...
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
}
