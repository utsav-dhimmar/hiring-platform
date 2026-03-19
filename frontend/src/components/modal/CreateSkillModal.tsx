/**
 * Modal for creating or updating a skill.
 * Uses Zod for form validation.
 */

import { useCallback } from "react";
import { adminSkillService } from "../../apis/admin/service";
import type { SkillRead } from "../../apis/admin/types";
import { Button, Input } from "../../components/common";
import "../../css/adminDashboard.css";
import { useFormModal } from "../../hooks";
import {
  skillCreateSchema,
  skillUpdateSchema,
  type SkillCreateFormValues,
} from "../../schemas/admin";

interface CreateSkillModalProps {
  show: boolean;
  handleClose: () => void;
  onSkillSaved: () => void;
  skill: SkillRead | null;
}

const DEFAULT_SKILL_VALUES: SkillCreateFormValues = {
  name: "",
  description: "",
};

const CreateSkillModal = ({ show, handleClose, onSkillSaved, skill }: CreateSkillModalProps) => {
  const isEditMode = !!skill;

  const mapItemToValues = useCallback(
    (s: SkillRead): SkillCreateFormValues => ({
      name: s.name,
      description: s.description || "",
    }),
    [],
  );

  const onSubmit = useCallback(
    async (data: SkillCreateFormValues) => {
      if (isEditMode && skill) {
        await adminSkillService.updateSkill(skill.id, data);
      } else {
        await adminSkillService.createSkill(data);
      }
      onSkillSaved();
      handleClose();
    },
    [isEditMode, skill, onSkillSaved, handleClose],
  );

  const {
    register,
    handleSubmit,
    isSubmitting,
    submitError,
    formState: { errors },
  } = useFormModal<SkillCreateFormValues, SkillRead>({
    schema: isEditMode ? skillUpdateSchema : skillCreateSchema,
    defaultValues: DEFAULT_SKILL_VALUES,
    item: skill,
    show,
    mapItemToValues,
    onSubmit,
  });

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-dialog-scrollable">
        <div className="modal-header">
          <h2>{isEditMode ? "Edit Skill" : "Create New Skill"}</h2>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {submitError && <div className="alert alert-danger">{submitError}</div>}

            <Input
              label="Skill Name"
              {...register("name")}
              error={errors.name?.message}
              placeholder="e.g. React.js"
              required
            />

            <div className="form-group mb-3">
              <label className="form-label">Description</label>
              <textarea
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                rows={3}
                {...register("description")}
                placeholder="Briefly describe the skill..."
              />
              {errors.description && (
                <div className="invalid-feedback">{errors.description.message}</div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="outline-secondary" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditMode ? "Update Skill" : "Create Skill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSkillModal;
