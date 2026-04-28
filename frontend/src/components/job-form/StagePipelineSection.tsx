import { useState, useEffect, useRef, useCallback } from "react";
import {
  GripVertical,
  Trash2,
  Plus,
  Loader2,
  Layers,
  Shield,
  Wand2,
  Info,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { adminJobService } from "@/apis/admin/job";
import { adminStageTemplateService } from "@/apis/admin/stageTemplate";
import { jobStageService } from "@/apis/jobStage";
import { StageDetailDialog } from "@/components/admin/StageDetailDialog";
import type { JobStageConfig, StageTemplate } from "@/types/stage";

interface StagePipelineSectionProps {
  /** Job ID — null in create mode before the job is saved */
  jobId: string | null;
}

/**
 * Manages the interview stage pipeline for a specific job.
 * Supports add, remove, reorder (native drag-and-drop), and setup defaults.
 */
export const StagePipelineSection = ({ jobId }: StagePipelineSectionProps) => {
  // --- Create-mode placeholder (no jobId yet) ---
  if (!jobId) {
    return (
      <div className="app-surface-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Interview Pipeline</h2>
        </div>
        <div className="py-10 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-primary/20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Layers className="h-7 w-7 text-primary" />
          </div>
          <p className="text-foreground font-semibold text-base">
            Save the job to configure interview stages
          </p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Once you create this job, you'll be redirected here to set up and reorder your interview pipeline.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-primary font-bold">
            <span>Create job</span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Configure stages</span>
          </div>
        </div>
      </div>
    );
  }

  const [stages, setStages] = useState<JobStageConfig[]>([]);
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSettingDefaults, setIsSettingDefaults] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<StageTemplate | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Drag-and-drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const fetchStages = useCallback(async () => {
    try {
      const data = await adminJobService.getJobStages(jobId);
      setStages(data.sort((a, b) => a.stage_order - b.stage_order));
    } catch (error) {
      console.error("Failed to fetch job stages:", error);
      toast.error("Failed to load interview stages");
    }
  }, [jobId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await adminStageTemplateService.getAllTemplates();
      setTemplates(data.data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchStages(), fetchTemplates()]);
      setIsLoading(false);
    };
    init();
  }, [fetchStages, fetchTemplates]);

  // Templates not yet added to this job
  const availableTemplates = templates.filter(
    (t) => !stages.some((s) => s.template_id === t.id),
  );

  const handleAddStage = async () => {
    if (!selectedTemplateId) return;
    setIsAdding(true);
    try {
      await adminJobService.addStageToJob(jobId, {
        template_id: selectedTemplateId,
        stage_order: stages.length + 1,
        is_mandatory: true,
      });
      toast.success("Stage added to pipeline");
      setSelectedTemplateId("");
      await fetchStages();
    } catch (error) {
      console.error("Failed to add stage:", error);
      toast.error("Failed to add stage");
    } finally {
      setIsAdding(false);
    }
  };

  const handleShowInfo = (template: StageTemplate) => {
    setSelectedTemplate(template);
    setIsDetailOpen(true);
  };

  const handleRemoveStage = async (configId: string) => {
    setRemovingId(configId);
    try {
      await adminJobService.removeStageFromJob(jobId, configId);
      toast.success("Stage removed from pipeline");
      await fetchStages();
    } catch (error) {
      console.error("Failed to remove stage:", error);
      toast.error("Failed to remove stage");
    } finally {
      setRemovingId(null);
    }
  };

  const handleSetupDefaults = async () => {
    setIsSettingDefaults(true);
    try {
      // Remove all existing stages first to ensure a clean default setup
      if (stages.length > 0) {
        await Promise.all(
          stages.map((s) => adminJobService.removeStageFromJob(jobId, s.id)),
        );
      }

      await jobStageService.setupDefaultStages(jobId);
      toast.success("Default pipeline configured");
      await fetchStages();
    } catch (error) {
      console.error("Failed to setup defaults:", error);
      toast.error("Failed to setup default pipeline");
    } finally {
      setIsSettingDefaults(false);
    }
  };

  // --- Native HTML Drag-and-Drop ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    requestAnimationFrame(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = "0.4";
      }
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  };

  const handleDragLeave = () => {
    setOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      resetDragState();
      return;
    }

    // Reorder locally first for instant feedback
    const reordered = [...stages];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setStages(reordered);
    resetDragState();

    // Persist via API
    try {
      await adminJobService.reorderJobStages(jobId, {
        stage_ids: reordered.map((s) => s.id),
      });
      toast.success("Pipeline reordered");
    } catch (error) {
      console.error("Failed to reorder stages:", error);
      toast.error("Failed to reorder — reverting");
      await fetchStages(); // rollback
    }
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  const resetDragState = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
    setDragIndex(null);
    setOverIndex(null);
    dragNodeRef.current = null;
  };

  // --- Render ---

  if (isLoading) {
    return (
      <div className="app-surface-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Interview Pipeline</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground font-medium">Loading stages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-surface-card space-y-5 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Interview Pipeline</h2>
          </div>
          <p className="text-muted-foreground text-base font-medium mt-0.5">
            Configure the interview stages for this job. Drag to reorder.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleSetupDefaults}
          disabled={isSettingDefaults}
          className="gap-2"
        >
          {isSettingDefaults ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Setup Defaults
        </Button>
      </div>

      {/* Add Stage */}
      <div className="flex items-center gap-3">
        <Select
          value={selectedTemplateId}
          onValueChange={(val) => setSelectedTemplateId(val ?? "")}
          disabled={availableTemplates.length === 0}
        >
          <SelectTrigger className="flex-1 h-10 rounded-xl border-muted-foreground/20 font-medium">
            <SelectValue
              placeholder={
                availableTemplates.length === 0
                  ? "All templates assigned"
                  : "Select a stage template..."
              }
            >
              {selectedTemplateId
                ? templates.find((t) => t.id === selectedTemplateId)?.name
                : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-primary/10">
            {availableTemplates.map((t) => (
              <SelectItem key={t.id} value={t.id} className="font-medium py-2.5">
                <div className="flex flex-col">
                  <span className="font-bold">{t.name}</span>
                  {t.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {t.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={handleAddStage}
          disabled={!selectedTemplateId || isAdding}
          className="gap-2 h-10 px-5 rounded-xl"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </Button>
      </div>

      {/* Stage List */}
      {stages.length === 0 ? (
        <div className="py-12 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/10">
          <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            No stages configured yet.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add stages above or click "Setup Defaults" to start.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {stages.map((stage, index) => {
            const isOver = overIndex === index;
            const isDragging = dragIndex === index;

            return (
              <div
                key={stage.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all duration-200 group",
                  "bg-background hover:bg-muted/30",
                  isDragging && "opacity-40",
                  isOver && "border-primary/50 bg-primary/5",
                  !isOver && "border-border",
                )}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Order Badge */}
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                  {index + 1}
                </div>

                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {stage.template?.name || "Unknown Stage"}
                  </p>
                  {stage.template?.description && (
                    <p className="text-xs text-muted-foreground max-w-2xl">
                      {stage.template.description}
                    </p>
                  )}
                </div>

                {/* Mandatory Badge */}
                {stage.is_mandatory && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-xs rounded-lg bg-amber-500/10 text-amber-600 border-none font-bold gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    Required
                  </Badge>
                )}

                {/* Info Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleShowInfo(stage.template)}
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Info className="h-4 w-4" />
                </Button>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStage(stage.id)}
                  disabled={removingId === stage.id}
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  {removingId === stage.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {/* Info Dialog */}
      <StageDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        template={selectedTemplate}
      />
    </div>
  );
};
