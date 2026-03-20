/**
 * Admin page for managing job postings.
 * Displays all jobs with ability to create, edit, and delete.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminJobService } from "../../apis/admin/service";
import type { JobRead } from "../../apis/admin/types";
import {
  AdminDataTable,
  Button,
  DateDisplay,
  PageHeader,
  StatusBadge,
  StagesBadgeList,
  SkillsBadgeList,
  type Column,
} from "../../components/common";
import { CreateJobModal, DeleteModal } from "../../components/modal";
import "../../css/adminDashboard.css";
import { useAdminData, useDeleteConfirmation } from "../../hooks";

const AdminJobs = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRead | null>(null);

  const {
    data: jobs,
    loading,
    error,
    fetchData: fetchJobs,
  } = useAdminData<JobRead>(() => adminJobService.getAllJobs());

  const {
    showModal: showDeleteModal,
    handleDeleteClick,
    handleClose: handleCloseDelete,
    handleConfirm: handleConfirmDelete,
    isDeleting,
    error: deleteError,
    message: deleteMessage,
  } = useDeleteConfirmation<JobRead>({
    deleteFn: (id) => adminJobService.deleteJob(id as string),
    onSuccess: fetchJobs,
    itemTitle: (job) => `job "${job.title}"`,
  });

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

  const columns: Column<JobRead>[] = [
    { header: "Title", accessor: "title" },
    { header: "Department", accessor: (job) => job.department || "N/A" },
    {
      header: "Status",
      accessor: (job) => <StatusBadge status={job.is_active} />,
    },
    {
      header: "Skills",
      accessor: (job) => <SkillsBadgeList skills={job.skills} />,
    },
    {
      header: "Stages",
      accessor: (job) => <StagesBadgeList stages={job.stages} />,
    },
    {
      header: "Created At",
      accessor: (job) => <DateDisplay date={job.created_at} showTime={false} />,
    },
    {
      header: "Actions",
      accessor: (job) => (
        <>
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
          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(job)}>
            Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="admin-dashboard">
      <PageHeader
        title="Job Management"
        actions={
          <Button variant="primary" onClick={handleCreateClick}>
            Create Job
          </Button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={jobs}
        loading={loading}
        error={error}
        onRetry={fetchJobs}
        rowKey="id"
        emptyMessage="No jobs found. Create one to get started."
      />

      <CreateJobModal
        show={showModal}
        handleClose={handleCloseModal}
        onJobSaved={fetchJobs}
        job={selectedJob}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete Job"
        message={deleteMessage}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminJobs;
