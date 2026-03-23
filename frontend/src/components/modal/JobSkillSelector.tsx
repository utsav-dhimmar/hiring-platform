import { Button, ErrorDisplay } from "@/components/shared";
import type { SkillRead } from "@/types/admin";

interface JobSkillSelectorProps {
  skills: SkillRead[];
  selectedSkillIds: string[];
  loading: boolean;
  error: string | null;
  onToggleSkill: (skillId: string) => void;
  onAddSkill: () => void;
  errorMessage?: string;
}

const JobSkillSelector = ({
  skills,
  selectedSkillIds,
  loading,
  error,
  onToggleSkill,
  onAddSkill,
  errorMessage,
}: JobSkillSelectorProps) => {
  return (
    <div className="job-skills-section">
      <div className="job-skills-header d-flex justify-content-between align-items-center mb-2">
        <div>
          <label className="form-label mb-0">Required Skills</label>
          <p className="job-skills-help text-muted small mb-0">
            Select the skills that should be linked to this job.
          </p>
        </div>
        <Button variant="outline-primary" size="sm" type="button" onClick={onAddSkill}>
          Add Skill
        </Button>
      </div>

      {error && <ErrorDisplay message={error} />}

      <div className="job-skills-panel border rounded p-3 bg-light">
        {loading ? (
          <p className="job-skills-empty text-center py-3">Loading skills...</p>
        ) : skills.length === 0 ? (
          <p className="job-skills-empty text-center py-3">
            No skills found yet. Add a skill to start linking jobs.
          </p>
        ) : (
          <div className="job-skills-grid d-flex flex-wrap gap-2">
            {skills.map((skill) => (
              <label
                key={skill.id}
                className={`job-skill-option d-flex flex-column p-2 border rounded cursor-pointer ${selectedSkillIds.includes(skill.id)
                    ? "border-primary bg-primary bg-opacity-10"
                    : "bg-white"
                  }`}
                style={{ width: "calc(33.33% - 0.75rem)", minWidth: "150px" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedSkillIds.includes(skill.id)}
                    onChange={() => onToggleSkill(skill.id)}
                  />
                  <span className="fw-bold">{skill.name}</span>
                </div>
                <small className="text-muted text-truncate">
                  {skill.description || "No description"}
                </small>
              </label>
            ))}
          </div>
        )}
      </div>

      {errorMessage && <div className="invalid-feedback d-block">{errorMessage}</div>}
    </div>
  );
};

export default JobSkillSelector;
