/**
 * Modal for creating or updating a job posting.
 * Uses Zod for form validation and renders a shadcn Select for department.
 */

import { useCallback, useEffect, useState } from "react";
import {
  adminDepartmentService,
  adminJobService,
  adminSkillService,
} from "@/apis/admin/service";
import type { DepartmentRead, JobRead, SkillRead } from "@/types/admin";
import { Button, ErrorDisplay, Input } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFormModal } from "@/hooks";
import { jobCreateSchema, type JobCreateFormValues } from "@/schemas/admin";
import CreateSkillModal from "./CreateSkillModal";
import JobSkillSelector from "./JobSkillSelector";

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
      <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Job" : "Create New Job"}</DialogTitle>
          </DialogHeader>
          <form id="create-job-form" onSubmit={handleSubmit}>
            {submitError && <ErrorDisplay message={submitError} />}

            <Input
              label="Job Title"
              {...register("title")}
              error={errors.title?.message}
              placeholder="e.g. Senior Software Engineer"
              required
            />

            <div className="space-y-2 mb-3">
              <label className="text-sm font-medium">Department</label>
              <select
                className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 ${errors.department_id ? "border-destructive" : ""}`}
                {...register("department_id")}
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
              </select>
              {errors.department_id && (
                <p className="text-sm text-destructive">{errors.department_id.message}</p>
              )}
            </div>

            <div className="space-y-2 mb-3">
              <label className="text-sm font-medium">Job Description</label>
              <textarea
                className={`w-full rounded-md border border-input bg-background px-3 py-2 min-h-[150px] ${errors.jd_text ? "border-destructive" : ""}`}
                rows={6}
                {...register("jd_text")}
                placeholder="Paste the job description here..."
              />
              {errors.jd_text && <p className="text-sm text-destructive">{errors.jd_text.message}</p>}
            </div>

            <JobSkillSelector
              skills={skills}
              selectedSkillIds={selectedSkillIds}
              loading={skillsLoading}
              error={skillsError}
              onToggleSkill={toggleSkill}
              onAddSkill={() => setShowSkillModal(true)}
              errorMessage={errors.skill_ids?.message}
            />

            <div className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                id="is_active"
                {...register("is_active")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm">
                Active (Accepting applications)
              </label>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button type="submit" form="create-job-form" isLoading={isSubmitting}>
              {isEditMode ? "Update Job" : "Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
