/**
 * Modal for creating or updating a skill.
 * Uses Zod for form validation.
 */

import { useCallback } from "react";
import { adminSkillService } from "@/apis/admin/service";
import type { SkillRead } from "@/types/admin";
import { Button, Input } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Skill" : "Create New Skill"}</DialogTitle>
        </DialogHeader>
        <form id="create-skill-form" onSubmit={handleSubmit}>
          {submitError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          <Input
            label="Skill Name"
            {...register("name")}
            error={errors.name?.message}
            placeholder="e.g. React.js"
            required
          />

          <div className="space-y-2 mb-3">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className={`w-full rounded-md border border-input bg-background px-3 py-2 min-h-[80px] ${errors.description ? "border-destructive" : ""}`}
              rows={3}
              {...register("description")}
              placeholder="Briefly describe the skill..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="create-skill-form" isLoading={isSubmitting}>
            {isEditMode ? "Update Skill" : "Create Skill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSkillModal;
