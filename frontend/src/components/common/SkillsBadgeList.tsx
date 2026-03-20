/**
 * Reusable component to display a list of skills as badges.
 */

import React from "react";
import { Badge } from "react-bootstrap";
import type { SkillRead } from "../../apis/admin/types";

/**
 * Props for the SkillsBadgeList component.
 */
interface SkillsBadgeListProps {
  /** Optional array of skill objects */
  skills?: SkillRead[];
  /** Additional CSS class name */
  className?: string;
  /** Whether to show a label when no skills are found (default: "N/A") */
  emptyLabel?: string;
}

/**
 * Badge list for displaying skills.
 * @example
 * ```tsx
 * <SkillsBadgeList skills={job.skills} />
 * ```
 */
const SkillsBadgeList: React.FC<SkillsBadgeListProps> = ({
  skills,
  className = "",
  emptyLabel = "N/A",
}) => {
  if (!skills || skills.length === 0) {
    return <span className={`text-muted small ${className}`}>{emptyLabel}</span>;
  }

  return (
    <div className={`d-flex flex-wrap gap-1 align-items-center ${className}`}>
      {skills.map((skill) => (
        <Badge
          key={skill.id}
          bg="secondary"
          pill
          className="fw-normal"
          style={{ fontSize: "0.75rem", opacity: 0.85 }}
          title={skill.description || undefined}
        >
          {skill.name}
        </Badge>
      ))}
    </div>
  );
};

export default SkillsBadgeList;
