import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { JobVersionMinimal, JobVersionDetail } from "@/types/job";
import jobService from "@/apis/job";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, History, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface MoreJobSettingProps {
    jobId: string | null;
    versions: JobVersionMinimal[];
}

export function MoreJobSetting({ versions }: MoreJobSettingProps) {
    const { control, watch, setValue } = useFormContext();
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [previewVersion, setPreviewVersion] = useState<JobVersionDetail | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const selectedVersionNum = watch("processing_version");

    useEffect(() => {
        if (!selectedVersionId || !isDialogOpen) return;

        const fetchVersion = async () => {
            setIsPreviewLoading(true);
            try {
                const versionData = await jobService.getJobVersion(selectedVersionId);
                setPreviewVersion(versionData);
            } catch (error) {
                console.error("Failed to fetch version details:", error);
            } finally {
                setIsPreviewLoading(false);
            }
        };

        fetchVersion();
    }, [selectedVersionId, isDialogOpen]);

    const handleViewJD = (versionId: string) => {
        setIsDialogOpen(true);
        setSelectedVersionId(versionId);
    };

    if (!versions || versions.length === 0) return null;

    return (
        <Card className="border-muted/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <History className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">JD Version </h2>
                        <p className="text-xs text-muted-foreground">Select which JD version to use for candidate processing</p>
                    </div>
                </div>

                <FormField
                    control={control}
                    name="processing_version"
                    render={() => (
                        <FormItem className="space-y-4">
                            <FormLabel className="sr-only">Processing Version</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {versions.map((version) => {
                                        const isSelected = selectedVersionNum === version.version_num;
                                        return (
                                            <div
                                                key={version.id}
                                                className={cn(
                                                    "group relative flex items-center justify-between p-1 rounded-xl border-2 transition-all duration-200 cursor-pointer flec-row",
                                                    isSelected
                                                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                                                        : "border-muted/60 hover:border-muted-foreground/30 hover:bg-muted/10 bg-background/50"
                                                )}
                                                onClick={() => setValue("processing_version", version.version_num)}
                                            >

                                                <div className="flex items-center gap-2">
                                                    <Badge variant={isSelected ? "default" : "outline"} className="px-2 py-0 h-6 font-bold">
                                                        V{version.version_num}
                                                    </Badge>
                                                    {isSelected && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary animate-in fade-in slide-in-from-left-1">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs font-semibold border border-muted rounded-xl hover:text-primary transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewJD(version.id);
                                                    }}
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                    View JD
                                                </Button>
                                            </div>

                                        );
                                    })}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>

            {/* JD Preview Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-muted-foreground/20 shadow-2xl rounded-2xl h-[600px]">
                    <DialogHeader className="p-2 pb-2 border-b border-muted-foreground/10 bg-muted/30">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <Badge variant="outline" className="h-7 px-2.5 font-bold text-sm bg-background">
                                V{previewVersion?.version_number}
                            </Badge>
                            JD Preview
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative min-h-[300px]">
                        {isPreviewLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-[2px] z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm font-medium text-muted-foreground">Loading JD content...</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="p-2">
                                    {previewVersion?.jd_text ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed font-sans">
                                                {previewVersion.jd_text}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground italic bg-muted/5 rounded-xl border border-dashed border-muted">
                                            No JD text available for this version.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
