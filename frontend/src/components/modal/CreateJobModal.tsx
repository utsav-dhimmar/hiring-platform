/**
 * Modal for creating or updating a job posting.
 * Uses Zod for form validation and renders a Bootstrap select for department.
 */

import { useCallback, useEffect, useState } from "react";
import { Form, Modal } from "react-bootstrap";
import {
  adminDepartmentService,
  adminJobService,
  adminSkillService,
} from "../../apis/admin/service";
import type { DepartmentRead, JobRead, SkillRead } from "../../apis/admin/types";
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
  department_id: "",
  jd_text: "",
  is_active: true,
  skill_ids: [],
};

const CreateJobModal = ({ show, handleClose, onJobSaved, job }: CreateJobModalProps) => {
  const [skills, setSkills] = useState<SkillRead[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const [departments, setDepartments] = useState<DepartmentRead[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const isEditMode = !!job;

  const mapItemToValues = useCallback(
    (j: JobRead): JobCreateFormValues => ({
      title: j.title,
      department_id: j.department_id ?? "",
      jd_text: j.jd_text || "",
      is_active: j.is_active,
      skill_ids: j.skills?.map((skill) => skill.id) || [],
    }),
    [],
  );

  const onSubmit = useCallback(
    async (data: JobCreateFormValues) => {
      // Convert empty string department_id to undefined before sending
      const payload = {
        ...data,
        department_id: data.department_id || undefined,
      };
      if (isEditMode && job) {
        await adminJobService.updateJob(job.id, payload);
      } else {
        await adminJobService.createJob(payload);
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
      const result = await adminSkillService.getAllSkills();
      setSkills(result.data);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
      setSkillsError("Failed to load skills.");
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      setDeptLoading(true);
      const result = await adminDepartmentService.getAllDepartments();
      setDepartments(result.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    } finally {
      setDeptLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      void fetchSkills();
      void fetchDepartments();
      setShowSkillModal(false);
    }
  }, [show, fetchSkills, fetchDepartments]);

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

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? "Edit Job" : "Create New Job"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form id="create-job-form" onSubmit={handleSubmit}>
            {submitError && <ErrorDisplay message={submitError} />}

            <Input
              label="Job Title"
              {...register("title")}
              error={errors.title?.message}
              placeholder="e.g. Senior Software Engineer"
              required
            />

            <div className="form-group mb-3">
              <label className="form-label">Department</label>
              <Form.Select
                {...register("department_id")}
                isInvalid={!!errors.department_id}
                disabled={deptLoading}
              >
                <option value="">
                  {deptLoading ? "Loading departments…" : "— Select a department —"}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
              {errors.department_id && (
                <Form.Control.Feedback type="invalid">
                  {errors.department_id.message}
                </Form.Control.Feedback>
              )}
            </div>

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
              <div className="job-skills-header d-flex justify-content-between align-items-center mb-2">
                <div>
                  <label className="form-label mb-0">Required Skills</label>
                  <p className="job-skills-help text-muted small mb-0">
                    Select the skills that should be linked to this job.
                  </p>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  type="button"
                  onClick={() => setShowSkillModal(true)}
                >
                  Add Skill
                </Button>
              </div>

              {skillsError && <ErrorDisplay message={skillsError} />}

              <div className="job-skills-panel border rounded p-3 bg-light">
                {skillsLoading ? (
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
                        className={`job-skill-option d-flex flex-column p-2 border rounded cursor-pointer ${
                          selectedSkillIds.includes(skill.id)
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
                            onChange={() => toggleSkill(skill.id)}
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

              {errors.skill_ids?.message && (
                <div className="invalid-feedback d-block">{errors.skill_ids.message}</div>
              )}
            </div>

            <div className="form-check mt-3">
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
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="create-job-form" isLoading={isSubmitting}>
            {isEditMode ? "Update Job" : "Create Job"}
          </Button>
        </Modal.Footer>
      </Modal>

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

