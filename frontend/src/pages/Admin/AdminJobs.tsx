/**
 * Admin page for managing job postings.
 * Displays all jobs with ability to create, edit, and delete.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminJobService } from "../../apis/admin/service";
import type { JobRead } from "../../apis/admin/types";
import {
  Card,
  CardBody,
  Button,
  DateDisplay,
  DeleteModal,
} from "../../components/common";
import CreateJobModal from "./CreateJobModal";
import axios from "axios";
import "../../css/adminDashboard.css";

const AdminJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRead | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobRead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminJobService.getAllJobs();
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreateClick = () => {
    setSelectedJob(null);
    setShowModal(true);
  };

  const handleEditClick = (job: JobRead) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const handleViewCandidates = (jobId: string) => {
    navigate(`/admin/jobs/${jobId}/candidates`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  const handleDeleteClick = (job: JobRead) => {
    setJobToDelete(job);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminJobService.deleteJob(jobToDelete.id);
      await fetchJobs();
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (err: unknown) {
      let errorMsg = "Failed to delete job.";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setDeleteError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && jobs.length === 0)
    return <div className="admin-loading">Loading jobs...</div>;
  if (error && jobs.length === 0)
    return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Job Management</h1>
        <Button variant="primary" onClick={handleCreateClick}>
          Create Job
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.department || "N/A"}</td>
                    <td>
                      <span
                        className={`badge bg-${job.is_active ? "success" : "danger"}`}
                      >
                        {job.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <DateDisplay date={job.created_at} showTime={false} />
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewCandidates(job.id)}
                      >
                        Candidates
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditClick(job)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(job)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <CreateJobModal
        show={showModal}
        handleClose={handleCloseModal}
        onJobSaved={fetchJobs}
        job={selectedJob}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleConfirmDelete}
        title="Delete Job"
        message={`Are you sure you want to delete job "${jobToDelete?.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminJobs;
