import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { StageTemplate } from "@/types/stage";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Badge } from "@/components/ui/badge";
import { CRITERIA_MOCK_DATA } from "@/constants/admin";

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

    const criteriaIds = (template.default_config?.criteria_ids as number[]) || [];
    const associatedCriteria = CRITERIA_MOCK_DATA.filter(c => criteriaIds.includes(c.id));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex w-[calc(100vw-1rem)] flex-col sm:w-[92vw] sm:max-w-[92vw] lg:max-w-250 max-h-[calc(100vh-1rem)] sm:max-h-[92vh] p-0 overflow-hidden rounded-[1.75rem] sm:rounded-3xl border-muted-foreground/10 bg-card/95 backdrop-blur-xl shadow-2xl ">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background -z-10" />

                <DialogHeader className="pt-3 px-2 pb-2 sm:pt-4 sm:px-3">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-start gap-3 pr-10 sm:items-center sm:gap-4">
                            {template.name}
                        </DialogTitle>
                        {/* <Badge variant={template.default_config?.is_active !== false ? "default" : "secondary"} className="h-6">
                            {template.default_config?.is_active !== false ? "Active" : "Inactive"}
                        </Badge> */}
                    </div>
                    <DialogDescription className="text-base text-muted-foreground mt-2 line-clamp-2">
                        {template.description || "No description provided for this stage."}
                    </DialogDescription>
                </DialogHeader>

                {/* <ScrollArea className="flex-1 p-6 pt-2"  >
                    <div className="space-y-2">
                        <section>
                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                                Stage Configuration
                            </h4>
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Total Criteria</p>
                                    <p className="text-lg font-bold">{associatedCriteria.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Created At</p>
                                    <p className="text-sm font-medium">N/A</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                                Associated Evaluation Criteria
                            </h4>
                            {associatedCriteria.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {associatedCriteria.map(c => (
                                        <Badge
                                            key={c.id}
                                            variant="outline"
                                            className="px-3 py-1.5 text-sm bg-background/50 border-primary/20 hover:border-primary/50 transition-colors"
                                        >
                                            {c.info.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground italic">
                                    No criteria associated with this stage.
                                </div>
                            )}
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                                Raw Configuration (JSON)
                            </h4>
                            <pre className="p-4 rounded-xl bg-slate-950 text-slate-50 text-xs overflow-x-auto font-mono">
                                {JSON.stringify(template.default_config, null, 2)}
                            </pre>
                        </section>
                    </div>
                </ScrollArea> */}

                <DialogFooter className="p-6 pt-2 border-t bg-muted/10">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-8">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
