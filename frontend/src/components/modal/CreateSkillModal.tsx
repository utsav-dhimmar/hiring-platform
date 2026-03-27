/**
 * Modal for creating or updating a skill.
 * Uses Zod for form validation and shadcn components.
 */

import { useCallback } from "react";
import { adminSkillService } from "@/apis/admin/service";
import type { SkillRead } from "@/types/admin";
import {
  Button,
  Input,
  Textarea,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFormModal } from "@/hooks";
import { skillCreateSchema, type SkillCreateFormValues } from "@/schemas/admin";
import { ErrorDisplay } from "@/components/shared";

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

  const formModal = useFormModal<SkillCreateFormValues, SkillRead>({
    schema: skillCreateSchema,
    defaultValues: DEFAULT_SKILL_VALUES,
    item: skill,
    show,
    mapItemToValues,
    onSubmit,
  });

  const { handleFormSubmit, isSubmitting, submitError, control } = formModal;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Skill" : "Create New Skill"}</DialogTitle>
        </DialogHeader>

        {submitError && <ErrorDisplay message={submitError} />}

        <Form {...formModal}>
          <form id="create-skill-form" onSubmit={handleFormSubmit} className="space-y-4">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. React.js" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly describe the skill..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} type="button" disabled={isSubmitting}>
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
