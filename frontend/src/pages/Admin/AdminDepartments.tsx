/**
 * Admin page for managing departments.
 * Displays all departments with ability to create, edit, and delete.
 */
import { useState, useEffect } from "react";
import { adminDepartmentService } from "@/apis/admin/service";
import type { DepartmentRead } from "@/types/admin";
import { AppPageShell, PageHeader, useToast, DataTable, ErrorDisplay } from "@/components/shared";
import { CreateDepartmentModal, DeleteModal } from "@/components/modal";
import { useAdminData, useDeleteConfirmation } from "@/hooks";
import { Edit2, Trash2Icon, ArrowUpDown } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components";

const AdminDepartments = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentRead | null>(null);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: departments,
    total,
    loading,
    error,
    fetchData: fetchDepartments,
  } = useAdminData<DepartmentRead>(() =>
    adminDepartmentService.getAllDepartments(pageIndex * pageSize, pageSize),
  );

  // Refetch when pagination changes
  useEffect(() => {
    fetchDepartments();
  }, [pageIndex, pageSize, fetchDepartments]);

  const {
    showModal: showDeleteModal,
    handleDeleteClick,
    handleClose: handleCloseDelete,
    handleConfirm: handleConfirmDelete,
    isDeleting,
    error: deleteError,
    message: deleteMessage,
  } = useDeleteConfirmation<DepartmentRead>({
    deleteFn: (id) => adminDepartmentService.deleteDepartment(id as string),
    onSuccess: () => {
      fetchDepartments();
      toast.success("Department deleted successfully");
    },
    itemTitle: (dept) => `department "${dept.name}"`,
  });

  const handleCreateClick = () => {
    setSelectedDepartment(null);
    setShowModal(true);
  };

  const handleEditClick = (dept: DepartmentRead) => {
    setSelectedDepartment(dept);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDepartment(null);
  };

  const columns: ColumnDef<DepartmentRead>[] = [
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
        title="Department Management"

        actions={
          <Button onClick={handleCreateClick} className="rounded-xl px-6">
            Create Department
          </Button>
        }
      />

      {error && !departments.length ? (
        <ErrorDisplay message={error} onRetry={fetchDepartments} />
      ) : (
        <DataTable
          columns={columns}
          data={departments}
          loading={loading}
          searchKey="name"
          searchPlaceholder="Filter departments by name..."
          initialSorting={[{ id: "name", desc: false }]}
          isServerSide={true}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={Math.ceil(total / pageSize)}
          onPaginationChange={setPagination}
        />
      )}

      <CreateDepartmentModal
        show={showModal}
        handleClose={handleCloseModal}
        onDepartmentSaved={fetchDepartments}
        department={selectedDepartment}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete Department"
        message={deleteMessage}
        isLoading={isDeleting}
        error={deleteError}
      />
    </AppPageShell>
  );
};

export default AdminDepartments;
