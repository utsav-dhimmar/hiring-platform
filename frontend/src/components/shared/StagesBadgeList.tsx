import type { JobStageConfig } from "@/types/stage";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Props for the StagesBadgeList component.
 */
interface StagesBadgeListProps {
  /** Optional array of job stage configurations */
  stages?: JobStageConfig[];
  /** Additional CSS class name */
  className?: string;
  /** Whether to show a label when no stages are found (default: "N/A") */
  emptyLabel?: string;
  /** Maximum number of stages to show before collapsing (default: 3) */
  maxVisible?: number;
}

/**
 * Badge list for displaying job stages with automatic sorting.
 */
const StagesBadgeList = ({
  stages,
  className = "",
  emptyLabel = "N/A",
  maxVisible = 3,
}: StagesBadgeListProps) => {
  if (!stages || stages.length === 0) {
    return <span className={`text-muted-foreground text-sm ${className}`}>{emptyLabel}</span>;
  }

  const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order);
  const visibleStages = sortedStages.slice(0, maxVisible);
  const remainingStages = sortedStages.slice(maxVisible);

  return (
    <div className={`flex flex-wrap gap-1 items-center ${className}`}>
      {visibleStages.map((stage) => (
        <Badge
          key={stage.id}
          variant="secondary"
          className="font-normal text-xs opacity-85"
          title={stage.template.description || undefined}
        >
          {stage.template.name}
        </Badge>
      ))}
      {remainingStages.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="font-normal text-xs cursor-pointer"
              >
                +{remainingStages.length} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-start">
                {sortedStages.map((stage) => (
                  <div key={stage.id} className="text-sm">
                    {stage.template.name}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default StagesBadgeList;
