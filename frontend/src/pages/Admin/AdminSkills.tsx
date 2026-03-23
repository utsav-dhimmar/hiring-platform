/**
 * Admin page for managing skills.
 * Displays all skills with ability to create, edit, and delete.
 */

import { useState, useEffect } from "react";
import { adminSkillService } from "@/apis/admin/service";
import type { SkillRead } from "@/types/admin";
import { AdminDataTable, Button, PageHeader, useToast, type Column } from "@/components/shared";
import { CreateSkillModal, DeleteModal } from "@/components/modal";
import "@/css/adminDashboard.css";
import { useAdminData, useDeleteConfirmation } from "@/hooks";

const AdminSkills = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillRead | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const {
    data: skills,
    total,
    loading,
    error,
    fetchData: fetchSkills,
  } = useAdminData<SkillRead>(() => adminSkillService.getAllSkills(skip, pageSize));

  // Refetch when page changes
  useEffect(() => {
    fetchSkills();
  }, [page, fetchSkills]);

  const {
    showModal: showDeleteModal,
    handleDeleteClick,
    handleClose: handleCloseDelete,
    handleConfirm: handleConfirmDelete,
    isDeleting,
    error: deleteError,
    message: deleteMessage,
  } = useDeleteConfirmation<SkillRead>({
    deleteFn: (id) => adminSkillService.deleteSkill(id as string),
    onSuccess: () => {
      fetchSkills();
      toast.success("Skill deleted successfully");
    },
    itemTitle: (skill) => `skill "${skill.name}"`,
  });

  const handleCreateClick = () => {
    setSelectedSkill(null);
    setShowModal(true);
  };

  const handleEditClick = (skill: SkillRead) => {
    setSelectedSkill(skill);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSkill(null);
  };

  const columns: Column<SkillRead>[] = [
    { header: "Name", accessor: "name" },
    { header: "Description", accessor: (skill) => skill.description || "N/A" },
    {
      header: "Actions",
      className: "text-end",
      accessor: (skill) => (
        <div className="d-flex gap-2 justify-content-end">
          <Button variant="outline-secondary" size="sm" onClick={() => handleEditClick(skill)}>
            Edit
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(skill)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-dashboard">
      <PageHeader
        title="Skill Management"
        actions={
          <Button variant="primary" onClick={handleCreateClick}>
            Create Skill
          </Button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={skills}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        loading={loading}
        error={error}
        onRetry={fetchSkills}
        rowKey="id"
        emptyMessage="No skills found. Create one to get started."
      />

      <CreateSkillModal
        show={showModal}
        handleClose={handleCloseModal}
        onSkillSaved={fetchSkills}
        skill={selectedSkill}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete Skill"
        message={deleteMessage}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminSkills;
