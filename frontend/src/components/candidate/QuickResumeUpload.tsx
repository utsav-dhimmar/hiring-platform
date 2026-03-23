import React, { useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { resumeService } from "@/apis/resume";
import { Button } from "@/components/shared";
import { useToast } from "@/components/shared";
import { extractErrorMessage } from "@/utils/error";

/**
 * Props for the QuickResumeUpload component.
 */
interface QuickResumeUploadProps {
  /** ID of the job to upload the resume for */
  jobId: string;
  /** Callback function called after successful upload */
  onSuccess?: () => void;
  /** Visual style variant of the button */
  variant?:
  | "primary"
  | "secondary"
  | "outline-primary"
  | "outline-secondary"
  | "success"
  | "outline-success"
  | "danger"
  | "outline-danger"
  | "warning"
  | "ghost";
  /** Size of the button */
  size?: "sm" | "lg";
  /** Additional CSS class names */
  className?: string;
  /** Text label to display on the button */
  label?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * A reusable component for quickly uploading a resume for a specific job.
 * Handles file selection, upload logic, and notifications.
 */
const QuickResumeUpload: React.FC<QuickResumeUploadProps> = ({
  jobId,
  onSuccess,
  variant = "outline-primary",
  size,
  className = "",
  label = "Upload Resume",
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  /**
   * Triggers the hidden file input click.
   */
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click in tables
    fileInputRef.current?.click();
  };

  /**
   * Handles the file selection and upload process.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (default 5MB)
    const MAX_SIZE_MB = Number(import.meta.env.VITE_RESUME_MAX_SIZE_MB) || 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.warn(`Resume size must be <= ${MAX_SIZE_MB} MB.`);
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await resumeService.uploadResume(jobId, file);
      toast.success("Resume uploaded successfully!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = extractErrorMessage(error, "Failed to upload resume.");
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={`quick-resume-upload d-inline-block ${className}`}>
      <Form.Control
        type="file"
        ref={fileInputRef}
        className="d-none"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx"
        disabled={disabled || isUploading}
      />
      <Button
        variant={variant}
        size={size}
        isLoading={isUploading}
        onClick={handleButtonClick}
        disabled={disabled}
        className="text-nowrap"
        title="Quick upload resume for this job"
      >
        {label}
      </Button>
    </div>
  );
};

export default QuickResumeUpload;
