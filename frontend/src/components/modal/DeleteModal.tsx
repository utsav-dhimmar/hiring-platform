/**
 * A reusable confirmation modal for delete actions.
 * Displays a title, message, and confirmation/cancel buttons.
 */

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * Props for the DeleteModal component.
 */
interface DeleteModalProps {
  /** Controls visibility of the modal */
  show: boolean;
  /** Callback to close the modal */
  handleClose: () => void;
  /** Callback fired when the delete is confirmed */
  handleConfirm: () => void;
  /** The title of the modal */
  title: string;
  /** The message/body of the modal */
  message: string;
  /** Text for the confirm button (default: "Delete") */
  confirmButtonText?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelButtonText?: string;
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
  /** Error message to display (if any) */
  error?: string | React.ReactNode | null;
  /** Variant for the confirm button (default: "destructive") */
  confirmVariant?: "destructive" | "default";
}

/**
 * Reusable modal for confirming destructive delete actions.
 */
const DeleteModal = ({
  show,
  handleClose,
  handleConfirm,
  title,
  message,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
  isLoading = false,
  error = null,
  confirmVariant = "destructive",
}: DeleteModalProps) => {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}
          <p className="mb-0">{message}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {cancelButtonText}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} isLoading={isLoading}>
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteModal;
