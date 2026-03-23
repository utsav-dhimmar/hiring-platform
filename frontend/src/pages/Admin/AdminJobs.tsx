/**
 * Admin page for managing job postings.
 * Displays all jobs with ability to create, edit, and delete.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminJobService } from "@/apis/admin/service";
import type { JobRead } from "@/types/admin";
import {
  AdminDataTable,
  Button,
  DateDisplay,
  PageHeader,
  StatusBadge,
  StagesBadgeList,
  SkillsBadgeList,
  useToast,
  type Column,
} from "@/components/shared";
import { CreateJobModal, DeleteModal, ManageJobStagesModal } from "@/components/modal";
import "@/css/adminDashboard.css";
import { useAdminData, useDeleteConfirmation } from "@/hooks";
import JobActionButtons from "./components/JobActionButtons";

const AdminJobs = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showStagesModal, setShowStagesModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRead | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const {
    data: jobs,
    total,
    loading,
    error,
    fetchData: fetchJobs,
  } = useAdminData<JobRead>(() => adminJobService.getAllJobs(skip, pageSize));

  // Refetch when page changes
  useEffect(() => {
    fetchJobs();
  }, [page, fetchJobs]);

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
    onSuccess: () => {
      fetchJobs();
      toast.success("Job deleted successfully");
    },
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

  const handleManageStages = (job: JobRead) => {
    setSelectedJob(job);
    setShowStagesModal(true);
  };

  const handleViewCandidates = (jobId: string) => {
    navigate(`/admin/jobs/${jobId}/candidates`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  const handleCloseStagesModal = () => {
    setShowStagesModal(false);
    setSelectedJob(null);
  };

  const columns: Column<JobRead>[] = [
    { header: "Title", accessor: "title" },
    {
      header: "Department",
      accessor: (job) => job.department?.name ?? job.department_name ?? "N/A",
    },
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
      className: "text-end text-nowrap",
      style: { width: "350px", minWidth: "350px" },
      accessor: (job) => (
        <JobActionButtons
          job={job}
          onViewCandidates={handleViewCandidates}
          onManageStages={handleManageStages}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
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
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
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

      <ManageJobStagesModal
        show={showStagesModal}
        handleClose={handleCloseStagesModal}
        job={selectedJob}
        onStagesUpdated={fetchJobs}
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
