import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StageTemplate } from "@/types/stage";

interface StageDeleteDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Stage template to delete */
  template: StageTemplate | null;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
  /** Callback when delete is cancelled */
  onCancel: () => void;
}

/**
 * Confirmation dialog for deleting a stage template.
 * Warns that the action cannot be undone.
 */
export const StageDeleteDialog = ({
  isOpen,
  onOpenChange,
  template,
  onConfirm,
  onCancel,
}: StageDeleteDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-xl font-bold">Delete Stage Template</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete the stage template{" "}
            <span className="font-semibold text-foreground">"{template?.name}"</span>? 
            This action cannot be undone and may affect jobs using this template.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="ghost" onClick={onCancel} className="rounded-xl font-semibold">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="rounded-xl">
            Delete Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
