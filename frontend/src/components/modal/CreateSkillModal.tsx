/**
 * Modal for creating or updating a skill.
 * Uses Zod for form validation.
 */

import { useCallback } from "react";
import { Modal } from "react-bootstrap";
import { adminSkillService } from "@/apis/admin/service";
import type { SkillRead } from "@/types/admin";
import { Button, Input } from "@/components/shared";
import "@/css/adminDashboard.css";
import { useFormModal } from "@/hooks";
import { skillCreateSchema, type SkillCreateFormValues } from "@/schemas/admin";

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
    schema: skillCreateSchema,
    defaultValues: DEFAULT_SKILL_VALUES,
    item: skill,
    show,
    mapItemToValues,
    onSubmit,
  });

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Edit Skill" : "Create New Skill"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form id="create-skill-form" onSubmit={handleSubmit}>
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
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="create-skill-form" isLoading={isSubmitting}>
          {isEditMode ? "Update Skill" : "Create Skill"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateSkillModal;
