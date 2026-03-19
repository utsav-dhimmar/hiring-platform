/**
 * Modal for creating or updating a job posting.
 * Uses Zod for form validation.
 */

import { useCallback, useEffect, useState } from "react";
import { adminJobService, adminSkillService } from "../../apis/admin/service";
import type { JobRead, SkillRead } from "../../apis/admin/types";
import { Button, ErrorDisplay, Input } from "../../components/common";
import "../../css/adminDashboard.css";
import { useFormModal } from "../../hooks";
import { jobCreateSchema, type JobCreateFormValues } from "../../schemas/admin";
import CreateSkillModal from "./CreateSkillModal";

interface CreateJobModalProps {
  show: boolean;
  handleClose: () => void;
  onJobSaved: () => void;
  job: JobRead | null;
}

const DEFAULT_JOB_VALUES: JobCreateFormValues = {
  title: "",
  department: "",
  jd_text: "",
  is_active: true,
  skill_ids: [],
};

const CreateJobModal = ({ show, handleClose, onJobSaved, job }: CreateJobModalProps) => {
  const [skills, setSkills] = useState<SkillRead[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const isEditMode = !!job;

  const mapItemToValues = useCallback(
    (j: JobRead): JobCreateFormValues => ({
      title: j.title,
      department: j.department || "",
      jd_text: j.jd_text || "",
      is_active: j.is_active,
      skill_ids: j.skills?.map((skill) => skill.id) || [],
    }),
    [],
  );

  const onSubmit = useCallback(
    async (data: JobCreateFormValues) => {
      if (isEditMode && job) {
        await adminJobService.updateJob(job.id, data);
      } else {
        await adminJobService.createJob(data);
      }
      onJobSaved();
      handleClose();
    },
    [isEditMode, job, onJobSaved, handleClose],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    isSubmitting,
    submitError,
    formState: { errors },
  } = useFormModal<JobCreateFormValues, JobRead>({
    schema: jobCreateSchema,
    defaultValues: DEFAULT_JOB_VALUES,
    item: job,
    show,
    mapItemToValues,
    onSubmit,
  });

  const selectedSkillIds = watch("skill_ids") ?? [];

  const fetchSkills = useCallback(async () => {
    try {
      setSkillsLoading(true);
      setSkillsError(null);
      const data = await adminSkillService.getAllSkills();
      setSkills(data);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
      setSkillsError("Failed to load skills.");
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      void fetchSkills();
      setShowSkillModal(false);
    }
  }, [show, fetchSkills]);

  const toggleSkill = (skillId: string) => {
    const nextSkillIds = selectedSkillIds.includes(skillId)
      ? selectedSkillIds.filter((id) => id !== skillId)
      : [...selectedSkillIds, skillId];

    setValue("skill_ids", nextSkillIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleSkillSaved = async () => {
    await fetchSkills();
    setShowSkillModal(false);
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-container modal-dialog-scrollable">
          <div className="modal-header">
            <h2>{isEditMode ? "Edit Job" : "Create New Job"}</h2>
            <button className="close-btn" onClick={handleClose}>
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {submitError && <ErrorDisplay message={submitError} />}

              <Input
                label="Job Title"
                {...register("title")}
                error={errors.title?.message}
                placeholder="e.g. Senior Software Engineer"
                required
              />

              <Input
                label="Department"
                {...register("department")}
                error={errors.department?.message}
                placeholder="e.g. Engineering"
              />

              <div className="form-group mb-3">
                <label className="form-label">Job Description</label>
                <textarea
                  className={`form-control ${errors.jd_text ? "is-invalid" : ""}`}
                  rows={6}
                  {...register("jd_text")}
                  placeholder="Paste the job description here..."
                />
                {errors.jd_text && <div className="invalid-feedback">{errors.jd_text.message}</div>}
              </div>

              <div className="job-skills-section">
                <div className="job-skills-header">
                  <div>
                    <label className="form-label mb-0">Required Skills</label>
                    <p className="job-skills-help">
                      Select the skills that should be linked to this job.
                    </p>
                  </div>
                  <Button
                    variant="outline-primary"
                    type="button"
                    onClick={() => setShowSkillModal(true)}
                  >
                    Add Skill
                  </Button>
                </div>

                {skillsError && <ErrorDisplay message={skillsError} />}

                <div className="job-skills-panel">
                  {skillsLoading ? (
                    <p className="job-skills-empty">Loading skills...</p>
                  ) : skills.length === 0 ? (
                    <p className="job-skills-empty">
                      No skills found yet. Add a skill to start linking jobs.
                    </p>
                  ) : (
                    <div className="job-skills-grid">
                      {skills.map((skill) => (
                        <label key={skill.id} className="job-skill-option">
                          <input
                            type="checkbox"
                            checked={selectedSkillIds.includes(skill.id)}
                            onChange={() => toggleSkill(skill.id)}
                          />
                          <span>
                            <strong>{skill.name}</strong>
                            <small>{skill.description || "No description"}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {errors.skill_ids?.message && (
                  <div className="invalid-feedback d-block">{errors.skill_ids.message}</div>
                )}
              </div>

              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="is_active"
                  {...register("is_active")}
                />
                <label className="form-check-label" htmlFor="is_active">
                  Active (Accepting applications)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="outline-secondary" onClick={handleClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>
                {isEditMode ? "Update Job" : "Create Job"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <CreateSkillModal
        show={showSkillModal}
        handleClose={() => setShowSkillModal(false)}
        onSkillSaved={handleSkillSaved}
        skill={null}
      />
    </>
  );
};

export default CreateJobModal;
