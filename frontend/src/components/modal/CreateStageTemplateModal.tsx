/**
 * Modal for creating or updating an interview stage template.
 * Uses Zod for form validation.
 */

import { useCallback } from "react";
import { Modal } from "react-bootstrap";
import { adminStageTemplateService } from "../../apis/admin/service";
import type { StageTemplate } from "../../apis/types/stage";
import { Button, ErrorDisplay, Input } from "../../components/common";
import "../../css/adminDashboard.css";
import { useFormModal } from "../../hooks";
import { stageTemplateCreateSchema, type StageTemplateCreateFormValues } from "../../schemas/admin";

interface CreateStageTemplateModalProps {
  show: boolean;
  handleClose: () => void;
  onTemplateSaved: () => void;
  template: StageTemplate | null;
}

const DEFAULT_TEMPLATE_VALUES: StageTemplateCreateFormValues = {
  name: "",
  description: "",
  default_config: {},
};

const CreateStageTemplateModal = ({
  show,
  handleClose,
  onTemplateSaved,
  template,
}: CreateStageTemplateModalProps) => {
  const isEditMode = !!template;

  const mapItemToValues = useCallback(
    (t: StageTemplate): StageTemplateCreateFormValues => ({
      name: t.name,
      description: t.description || "",
      default_config: t.default_config || {},
    }),
    [],
  );

  const onSubmit = useCallback(
    async (data: StageTemplateCreateFormValues) => {
      if (isEditMode && template) {
        await adminStageTemplateService.updateTemplate(template.id, data);
      } else {
        await adminStageTemplateService.createTemplate(data);
      }
      onTemplateSaved();
      handleClose();
    },
    [isEditMode, template, onTemplateSaved, handleClose],
  );

  const {
    register,
    handleSubmit,
    isSubmitting,
    submitError,
    formState: { errors },
  } = useFormModal<StageTemplateCreateFormValues, StageTemplate>({
    schema: stageTemplateCreateSchema,
    defaultValues: DEFAULT_TEMPLATE_VALUES,
    item: template,
    show,
    mapItemToValues,
    onSubmit,
  });

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? "Edit Stage Template" : "Create New Stage Template"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form id="create-stage-template-form" onSubmit={handleSubmit}>
          {submitError && <ErrorDisplay message={submitError} />}

          <Input
            label="Template Name"
            {...register("name")}
            error={errors.name?.message}
            placeholder="e.g. HR Screening, Technical Round"
            required
          />

          <div className="form-group mb-3">
            <label className="form-label">Description</label>
            <textarea
              className={`form-control ${errors.description ? "is-invalid" : ""}`}
              rows={3}
              {...register("description")}
              placeholder="Briefly describe the purpose of this stage..."
            />
            {errors.description && (
              <div className="invalid-feedback">{errors.description.message}</div>
            )}
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Default Configuration (JSON)</label>
            <textarea
              className="form-control"
              rows={4}
              readOnly
              value={JSON.stringify(DEFAULT_TEMPLATE_VALUES.default_config, null, 2)}
              disabled
            />
            <small className="text-muted">
              Advanced configuration is currently read-only in the UI.
            </small>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose} type="button">
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          form="create-stage-template-form"
          isLoading={isSubmitting}
        >
          {isEditMode ? "Update Template" : "Create Template"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateStageTemplateModal;
