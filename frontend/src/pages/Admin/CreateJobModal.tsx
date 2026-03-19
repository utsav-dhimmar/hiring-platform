/**
 * Modal for creating or updating a job posting.
 * Uses Zod for form validation.
 */

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { adminJobService } from "../../apis/admin/service";
import type { JobRead } from "../../apis/admin/types";
import { jobCreateSchema, jobUpdateSchema, type JobCreateFormValues } from "../../schemas/admin";
import { Button, Input } from "../../components/common";
import "./AdminDashboard.css";

interface CreateJobModalProps {
  show: boolean;
  handleClose: () => void;
  onJobSaved: () => void;
  job: JobRead | null;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  show,
  handleClose,
  onJobSaved,
  job,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!job;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobCreateFormValues>({
    resolver: zodResolver(isEditMode ? jobUpdateSchema : jobCreateSchema),
    defaultValues: {
      title: "",
      department: "",
      jd_text: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (show) {
      if (job) {
        reset({
          title: job.title,
          department: job.department || "",
          jd_text: job.jd_text || "",
          is_active: job.is_active,
        });
      } else {
        reset({
          title: "",
          department: "",
          jd_text: "",
          is_active: true,
        });
      }
      setSubmitError(null);
    }
  }, [show, job, reset]);

  const onSubmit = async (data: JobCreateFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditMode && job) {
        await adminJobService.updateJob(job.id, data);
      } else {
        await adminJobService.createJob(data);
      }
      onJobSaved();
      handleClose();
    } catch (err: unknown) {
      let errorMsg = isEditMode ? "Failed to update job." : "Failed to create job.";
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
      <div className="modal-container">
        <div className="modal-header">
          <h2>{isEditMode ? "Edit Job" : "Create New Job"}</h2>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            {submitError && <div className="alert alert-danger">{submitError}</div>}

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
              {errors.jd_text && (
                <div className="invalid-feedback">{errors.jd_text.message}</div>
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
  );
};

export default CreateJobModal;
