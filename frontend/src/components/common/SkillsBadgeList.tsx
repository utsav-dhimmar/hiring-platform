import React from "react";
import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
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
  /** Maximum number of skills to show before collapsing (default: 3) */
  maxVisible?: number;
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
  maxVisible = 3,
}) => {
  if (!skills || skills.length === 0) {
    return <span className={`text-muted small ${className}`}>{emptyLabel}</span>;
  }

  const visibleSkills = skills.slice(0, maxVisible);
  const remainingSkills = skills.slice(maxVisible);

  const renderTooltip = (props: any) => (
    <Tooltip id="skills-tooltip" {...props}>
      <div className="text-start">
        {skills.map((skill) => (
          <div key={skill.id}>{skill.name}</div>
        ))}
      </div>
    </Tooltip>
  );

  return (
    <div className={`d-flex flex-wrap gap-1 align-items-center ${className}`}>
      {visibleSkills.map((skill) => (
        <Badge
          key={skill.id}
          bg="secondary"
          pill
          className="fw-normal"
          style={{ fontSize: "0.71rem", opacity: 0.85 }}
          title={skill.description || undefined}
        >
          {skill.name}
        </Badge>
      ))}
      {remainingSkills.length > 0 && (
        <OverlayTrigger placement="top" overlay={renderTooltip}>
          <Badge
            bg="light"
            text="dark"
            pill
            className="fw-normal border cursor-pointer"
            style={{ fontSize: "0.71rem", cursor: "pointer" }}
          >
            +{remainingSkills.length} more
          </Badge>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default SkillsBadgeList;
