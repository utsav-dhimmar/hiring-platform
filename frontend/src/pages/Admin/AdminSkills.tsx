/**
 * Admin page for managing skills.
 * Displays all skills with ability to create, edit, and delete.
 */

import { useState } from "react";
import { adminSkillService } from "../../apis/admin/service";
import type { SkillRead } from "../../apis/admin/types";
import { AdminDataTable, Button, PageHeader, type Column } from "../../components/common";
import { CreateSkillModal, DeleteModal } from "../../components/modal";
import "../../css/adminDashboard.css";
import { useAdminData, useDeleteConfirmation } from "../../hooks";

const AdminSkills = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillRead | null>(null);

  const {
    data: skills,
    loading,
    error,
    fetchData: fetchSkills,
  } = useAdminData<SkillRead>(() => adminSkillService.getAllSkills());

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
    onSuccess: fetchSkills,
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
      accessor: (skill) => (
        <>
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => handleEditClick(skill)}
          >
            Edit
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(skill)}>
            Delete
          </Button>
        </>
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
