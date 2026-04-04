/**
 * Admin page for managing skills.
 * Displays all skills with ability to create, edit, and delete.
 */
import { useState, useEffect } from "react";
import { adminSkillService } from "@/apis/admin/service";
import type { SkillRead } from "@/types/admin";
import { AppPageShell, PageHeader, useToast, DataTable, ErrorDisplay } from "@/components/shared";
import { CreateSkillModal, DeleteModal } from "@/components/modal";
import { useAdminData, useDeleteConfirmation } from "@/hooks";
import { Edit2, Trash2Icon, ArrowUpDown } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components";

const AdminSkills = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillRead | null>(null);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: skills,
    total,
    loading,
    error,
    fetchData: fetchSkills,
  } = useAdminData<SkillRead>(() => adminSkillService.getAllSkills(pageIndex * pageSize, pageSize));

  // Refetch when pagination changes
  useEffect(() => {
    fetchSkills();
  }, [pageIndex, pageSize, fetchSkills]);

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

  const columns: ColumnDef<SkillRead>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "No description provided",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditClick(row.original)}
            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteClick(row.original)}
            className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppPageShell width="wide">
      <PageHeader
        title="Skill Management"
        actions={
          <Button onClick={handleCreateClick} className="rounded-xl px-6">
            Create Skill
          </Button>
        }
      />

      {error && !skills.length ? (
        <ErrorDisplay message={error} onRetry={fetchSkills} />
      ) : (
        <DataTable
          columns={columns}
          data={skills}
          loading={loading}
          searchKey="name"
          searchPlaceholder="Filter skills by name..."
          initialSorting={[{ id: "name", desc: false }]}
          isServerSide={true}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={Math.ceil(total / pageSize)}
          onPaginationChange={setPagination}
        />
      )}

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
    </AppPageShell>
  );
};

export default AdminSkills;
