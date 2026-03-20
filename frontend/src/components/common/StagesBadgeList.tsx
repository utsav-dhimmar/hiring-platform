import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import type { JobStageConfig } from "../../apis/types/stage";

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
 * @example
 * ```tsx
 * <StagesBadgeList stages={job.stages} />
 * ```
 */
const StagesBadgeList = ({
  stages,
  className = "",
  emptyLabel = "N/A",
  maxVisible = 3,
}: StagesBadgeListProps) => {
  if (!stages || stages.length === 0) {
    return <span className={`text-muted small ${className}`}>{emptyLabel}</span>;
  }

  // Sort stages by their defined order in the pipeline
  const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order);
  const visibleStages = sortedStages.slice(0, maxVisible);
  const remainingStages = sortedStages.slice(maxVisible);

  const renderTooltip = (props: any) => (
    <Tooltip id="stages-tooltip" {...props}>
      <div className="text-start">
        {sortedStages.map((stage) => (
          <div key={stage.id} className="small">
            {stage.template.name}
          </div>
        ))}
      </div>
    </Tooltip>
  );

  return (
    <div className={`d-flex flex-wrap gap-1 align-items-center ${className}`}>
      {visibleStages.map((stage) => (
        <Badge
          key={stage.id}
          bg="info"
          pill
          className="fw-normal"
          style={{ fontSize: "0.71rem", opacity: 0.85 }}
          title={stage.template.description || undefined}
        >
          {stage.template.name}
        </Badge>
      ))}
      {remainingStages.length > 0 && (
        <OverlayTrigger placement="top" overlay={renderTooltip}>
          <Badge
            bg="light"
            text="dark"
            pill
            className="fw-normal border cursor-pointer"
            style={{ fontSize: "0.71rem", cursor: "pointer" }}
          >
            +{remainingStages.length} more
          </Badge>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default StagesBadgeList;
