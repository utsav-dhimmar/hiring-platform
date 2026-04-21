import React, { useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { extractErrorMessage } from "@/utils/error";
// import { transcriptService } from "@/apis/transcript";
import { Input } from "../ui/input";
import type { Job } from "@/types/job";
import { cn } from "@/lib/utils";

const DEFAULT_EXTENSIONS = ".txt,.docx,.pdf";

interface TranscriptUploadProps {
  /** UUID of the candidate stage to upload transcript to */
  stageId?: string;
  /** Callback on successful upload */
  onSuccess?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Button label text */
  label?: string;
  /** Associated job */
  job: Job;
}

/**
 * A dedicated component for uploading transcripts to a specific job stage.
 * Handles file selection, validation, and upload logic.
 */
export function TranscriptUpload({
  stageId,
  onSuccess,
  className,
  label = "Transcribe",
}: TranscriptUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const rawExtensions = import.meta.env.VITE_ACCEPTED_TRANSCRIPT_EXTENSIONS || DEFAULT_EXTENSIONS;
  const acceptedExtensionsArray = rawExtensions
    .split(",")
    .map((ext: string) => ext.trim().toLowerCase());

  /**
   * Handles the file selection and upload process.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!stageId) {
      toast.error("Process stage ID is missing");
      return;
    }

    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;

    if (!acceptedExtensionsArray.includes(fileExtension)) {
      toast.error(`Invalid file type. Accepted types: ${acceptedExtensionsArray.join(", ")}`);
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const response = {
        message: "Transcript uploaded successfully!"
      }
      // const response = await transcriptService.uploadTranscription(stageId, file);
      toast.success(response.message || "Transcript uploaded successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage || "Failed to upload transcript");
    } finally {
      setIsUploading(false);
      // Reset input 
      event.target.value = "";
    }
  };

  return (
    <Field className={cn("w-full mb-2", className)}>
      <FieldLabel htmlFor="transcript">{label}</FieldLabel>
      <Input
        id="transcript"
        type="file"
        accept={rawExtensions}
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {/* <FieldDescription>Upload an interview transcript ({rawExtensions})</FieldDescription> */}
    </Field>
  );
}

