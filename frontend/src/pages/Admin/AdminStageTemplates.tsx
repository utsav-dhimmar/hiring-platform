/**
 * Admin page for managing interview stage templates.
 */

import { useState } from "react";
import { adminStageTemplateService } from "@/apis/admin/service";
import type { StageTemplate } from "@/types/stage";
import { AdminDataTable, Button, PageHeader, useToast, type Column } from "@/components/shared";
import { CreateStageTemplateModal, DeleteModal } from "@/components/modal";
import "@/css/adminDashboard.css";
import { useAdminData, useDeleteConfirmation } from "@/hooks";

const AdminStageTemplates = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StageTemplate | null>(null);

  const {
    data: templates,
    loading,
    error,
    fetchData: fetchTemplates,
  } = useAdminData<StageTemplate>(() => adminStageTemplateService.getAllTemplates());

  const {
    showModal: showDeleteModal,
    handleDeleteClick,
    handleClose: handleCloseDelete,
    handleConfirm: handleConfirmDelete,
    isDeleting,
    error: deleteError,
    message: deleteMessage,
  } = useDeleteConfirmation<StageTemplate>({
    deleteFn: (id) => adminStageTemplateService.deleteTemplate(id as string),
    onSuccess: () => {
      fetchTemplates();
      toast.success("Stage template deleted successfully");
    },
    itemTitle: (tpl) => `template "${tpl.name}"`,
  });

  const handleCreateClick = () => {
    setSelectedTemplate(null);
    setShowModal(true);
  };

  const handleEditClick = (template: StageTemplate) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTemplate(null);
  };

  const columns: Column<StageTemplate>[] = [
    { header: "Name", accessor: "name" },
    { header: "Description", accessor: (tpl) => tpl.description || "N/A" },
    {
      header: "Actions",
      className: "text-end",
      accessor: (tpl) => (
        <div className="d-flex gap-2 justify-content-end">
          <Button variant="outline-secondary" size="sm" onClick={() => handleEditClick(tpl)}>
            Edit
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(tpl)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-dashboard">
      <PageHeader
        title="Stage Template Management"
        actions={
          <Button variant="primary" onClick={handleCreateClick}>
            Create Template
          </Button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={templates}
        loading={loading}
        error={error}
        onRetry={fetchTemplates}
        rowKey="id"
        emptyMessage="No stage templates found. Create one to get started."
      />

      <CreateStageTemplateModal
        show={showModal}
        handleClose={handleCloseModal}
        onTemplateSaved={fetchTemplates}
        template={selectedTemplate}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete Stage Template"
        message={deleteMessage}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminStageTemplates;
