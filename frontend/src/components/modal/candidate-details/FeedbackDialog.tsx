import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CandidateDecisionFormValues } from "@/schemas/candidate";

/**
 * Props for {@link FeedbackDialog}.
 */
interface FeedbackDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CandidateDecisionFormValues>;
  onSubmit: (data: CandidateDecisionFormValues) => void;
  candidateName: string;
  isSubmitting: boolean;
}

/**
 * Confirmation dialog for submitting a screening decision (approve / reject / maybe)
 * with a required note. The dialog title and button variant adapt to the selected
 * decision type. Integrates with React Hook Form + Zod validation.
 */
export function FeedbackDialog({
  isOpen,
  onOpenChange,
  form,
  onSubmit,
  candidateName,
  isSubmitting,
}: FeedbackDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = form;

  const feedbackType = watch("decision");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${feedbackType === "approve"
                ? "bg-green-500/10 text-green-600"
                : feedbackType === "reject"
                  ? "bg-red-500/10 text-red-600"
                  : "bg-amber-500/10 text-amber-600"
                }`}
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            {feedbackType === "approve"
              ? "Approve Candidate"
              : feedbackType === "reject"
                ? "Reject Candidate"
                : "Mark as 'Maybe'"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Reason for{" "}
              {feedbackType === "approve"
                ? "Approval"
                : feedbackType === "reject"
                  ? "Rejection"
                  : "Decision"}
            </label>
            <span className="block text-[10px] text-muted-foreground italic mb-1">
              Minimum 10 characters required.
            </span>
            <Textarea
              placeholder={`Enter reason for ${feedbackType === "approve"
                ? "approving"
                : feedbackType === "reject"
                  ? "rejecting"
                  : "marking as maybe"
                } ${candidateName}...`}
              className={`min-h-[120px] rounded-2xl resize-none border-muted-foreground/20 focus:border-primary/30 transition-colors ${errors.note ? "border-red-500 focus:border-red-500" : ""
                }`}
              {...register("note")}
            />
            {errors.note && (
              <p className="text-xs font-bold text-red-500">
                {errors.note.message}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant={
              feedbackType === "approve"
                ? "default"
                : feedbackType === "reject"
                  ? "destructive"
                  : "secondary"
            }
            className="rounded-xl px-8"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isFormSubmitting}
          >
            {isSubmitting || isFormSubmitting
              ? "Submitting..."
              : `Confirm ${feedbackType === "approve"
                ? "Approval"
                : feedbackType === "reject"
                  ? "Rejection"
                  : "Decision"
              }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
