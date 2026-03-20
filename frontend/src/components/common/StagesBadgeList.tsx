/**
 * Reusable component to display a list of job stages as badges.
 */

import React from "react";
import { Badge } from "react-bootstrap";
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
}

/**
 * Badge list for displaying job stages with automatic sorting.
 * @example
 * ```tsx
 * <StagesBadgeList stages={job.stages} />
 * ```
 */
const StagesBadgeList: React.FC<StagesBadgeListProps> = ({
  stages,
  className = "",
  emptyLabel = "N/A",
}) => {
  if (!stages || stages.length === 0) {
    return <span className={`text-muted small ${className}`}>{emptyLabel}</span>;
  }

  // Sort stages by their defined order in the pipeline
  const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  return (
    <div className={`d-flex flex-wrap gap-1 align-items-center ${className}`}>
      {sortedStages.map((stage) => (
        <Badge
          key={stage.id}
          bg="info"
          pill
          className="fw-normal"
          style={{ fontSize: "0.75rem", opacity: 0.85 }}
          title={stage.template.description || undefined}
        >
          {stage.template.name}
        </Badge>
      ))}
    </div>
  );
};

export default StagesBadgeList;
