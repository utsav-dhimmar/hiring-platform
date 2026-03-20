/**
 * Modal for managing interview stages for a specific job.
 * Allows adding, removing, and reordering stages.
 */

import { useState, useEffect, useCallback } from "react";
import { adminJobService, adminStageTemplateService } from "../../apis/admin/service";
import type { JobRead } from "../../apis/admin/types";
import type { JobStageConfig, StageTemplate } from "../../apis/types/stage";
import { Button, ErrorDisplay, LoadingSpinner, PageHeader } from "../../components/common";
import "../../css/adminDashboard.css";
import { extractErrorMessage } from "../../utils/error";

interface ManageJobStagesModalProps {
  show: boolean;
  handleClose: () => void;
  job: JobRead | null;
  onStagesUpdated: () => void;
}

const ManageJobStagesModal = ({
  show,
  handleClose,
  job,
  onStagesUpdated,
}: ManageJobStagesModalProps) => {
  const [stages, setStages] = useState<JobStageConfig[]>([]);
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!job) return;
    try {
      setLoading(true);
      setError(null);
      const [stagesData, templatesData] = await Promise.all([
        adminJobService.getJobStages(job.id),
        adminStageTemplateService.getAllTemplates(),
      ]);
      setStages(stagesData.sort((a, b) => a.stage_order - b.stage_order));
      setTemplates(templatesData);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load stage data."));
    } finally {
      setLoading(false);
    }
  }, [job]);

  useEffect(() => {
    if (show && job) {
      fetchData();
    }
  }, [show, job, fetchData]);

  const handleAddStage = async (templateId: string) => {
    if (!job) return;
    try {
      setIsUpdating(true);
      setError(null);
      await adminJobService.addStageToJob(job.id, {
        template_id: templateId,
        stage_order: stages.length + 1,
        is_mandatory: true,
      });
      await fetchData();
      onStagesUpdated();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to add stage."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveStage = async (configId: string) => {
    if (!job) return;
    try {
      setIsUpdating(true);
      setError(null);
      await adminJobService.removeStageFromJob(job.id, configId);
      await fetchData();
      onStagesUpdated();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to remove stage."));
    } finally {
      setIsUpdating(false);
    }
  };

  const moveStage = async (index: number, direction: "up" | "down") => {
    if (!job) return;
    const newStages = [...stages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newStages.length) return;

    // Swap
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];

    try {
      setIsUpdating(true);
      setError(null);
      await adminJobService.reorderJobStages(job.id, {
        stage_ids: newStages.map((s) => s.id),
      });
      setStages(newStages.map((s, i) => ({ ...s, stage_order: i + 1 })));
      onStagesUpdated();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to reorder stages."));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!show || !job) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-lg">
        <div className="modal-header">
          <h2>Manage Stages: {job.title}</h2>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {error && <ErrorDisplay message={error} />}

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="row">
              <div className="col-md-7">
                <h4>Active Pipeline</h4>
                <div className="job-stages-list mt-3">
                  {stages.length === 0 ? (
                    <p className="text-muted italic">No stages configured for this job.</p>
                  ) : (
                    stages.map((stage, index) => (
                      <div key={stage.id} className="job-stage-item card mb-2 p-2 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <span className="badge bg-secondary me-2">{index + 1}</span>
                            <div>
                              <div className="fw-bold">{stage.template.name}</div>
                              <small className="text-muted">{stage.template.description}</small>
                            </div>
                          </div>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => moveStage(index, "up")}
                              disabled={index === 0 || isUpdating}
                            >
                              &uarr;
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => moveStage(index, "down")}
                              disabled={index === stages.length - 1 || isUpdating}
                            >
                              &darr;
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveStage(stage.id)}
                              disabled={isUpdating}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="col-md-5 border-start">
                <h4>Available Templates</h4>
                <div className="list-group mt-3">
                  {templates
                    .filter((tpl) => !stages.some((s) => s.template_id === tpl.id))
                    .map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="list-group-item list-group-item-action"
                        onClick={() => handleAddStage(tpl.id)}
                        disabled={isUpdating}
                      >
                        <div className="fw-bold">{tpl.name}</div>
                        <small>{tpl.description}</small>
                      </button>
                    ))}
                  {templates.length === 0 && (
                    <p className="text-muted small">No stage templates available.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageJobStagesModal;
