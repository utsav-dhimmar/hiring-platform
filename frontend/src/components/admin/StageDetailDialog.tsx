import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import type { StageTemplate } from "@/types/stage";
import { Label } from "../ui/label";


interface StageDetailDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
    /** Stage template to display */
    template: StageTemplate | null;
}

/**
 * Dialog for viewing stage template details.
 * Shows template name and description.
 */
export const StageDetailDialog = ({
    isOpen,
    onOpenChange,
    template,
}: StageDetailDialogProps) => {
    if (!template) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-muted-foreground/20 shadow-2xl rounded-2xl h-[600px]">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background -z-10" />

                <DialogHeader className="pt-3 px-2 pb-2 sm:pt-4 sm:px-3">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-start gap-3 pr-10 sm:items-center sm:gap-4">
                            {template.name}
                        </DialogTitle>

                    </div>
                    <DialogDescription className="text-base text-muted-foreground mt-2 line-clamp-2">
                        {template.description || "No description provided for this stage."}

                    </DialogDescription>
                </DialogHeader>
                <Label className="text-base text-muted-foreground mt-2 line-clamp-2"> SOON</Label>
                <DialogFooter className="p-6 pt-2 border-t bg-muted/10">
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
