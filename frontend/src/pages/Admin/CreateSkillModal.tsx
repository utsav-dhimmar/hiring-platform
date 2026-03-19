/**
 * Modal for creating or updating a skill.
 * Uses Zod for form validation.
 */

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { adminSkillService } from "../../apis/admin/service";
import type { SkillRead } from "../../apis/admin/types";
import {
  skillCreateSchema,
  skillUpdateSchema,
  type SkillCreateFormValues,
} from "../../schemas/admin";
import { Button, Input } from "../../components/common";
import "../../css/adminDashboard.css";

interface CreateSkillModalProps {
  show: boolean;
  handleClose: () => void;
  onSkillSaved: () => void;
  skill: SkillRead | null;
}

const CreateSkillModal: React.FC<CreateSkillModalProps> = ({
  show,
  handleClose,
  onSkillSaved,
  skill,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!skill;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SkillCreateFormValues>({
    resolver: zodResolver(isEditMode ? skillUpdateSchema : skillCreateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (show) {
      if (skill) {
        reset({
          name: skill.name,
          description: skill.description || "",
        });
      } else {
        reset({
          name: "",
          description: "",
        });
      }
      setSubmitError(null);
    }
  }, [show, skill, reset]);

  const onSubmit = async (data: SkillCreateFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditMode && skill) {
        await adminSkillService.updateSkill(skill.id, data);
      } else {
        await adminSkillService.createSkill(data);
      }
      onSkillSaved();
      handleClose();
    } catch (err: unknown) {
      let errorMsg = isEditMode
        ? "Failed to update skill."
        : "Failed to create skill.";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            {submitError && (
              <div className="alert alert-danger">{submitError}</div>
            )}

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
                <div className="invalid-feedback">
                  {errors.description.message}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <Button
              variant="outline-secondary"
              onClick={handleClose}
              type="button"
            >
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
