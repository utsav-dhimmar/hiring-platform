import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import type { StageTemplate } from "@/types/stage";


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
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Evaluation Criteria</h3>
                    {template.default_config?.evaluation_criteria ? (
                        <ul className="list-disc list-outside ml-5 space-y-2 text-sm">
                            {Array.isArray(template.default_config.evaluation_criteria) ? (
                                template.default_config.evaluation_criteria.map((criterion: any, index: number) => (
                                    <li key={index}>
                                        {typeof criterion === 'string' ? criterion : JSON.stringify(criterion)}
                                    </li>
                                ))
                            ) : (
                                <li>{String(template.default_config.evaluation_criteria)}</li>
                            )}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No evaluation criteria defined for this stage template.</p>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-muted/5">
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
