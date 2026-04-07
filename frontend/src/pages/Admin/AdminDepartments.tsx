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
import { Edit2, Trash2Icon, ArrowUpDown, AlertCircle } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components";
import { Badge } from "@/components/ui/badge";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/lib/permissions";

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

  /**
   * Parses the backend error message to extract job names if the department is in use.
   * Current Backend Response Format: "... ACTIVE Job(s): ['Job A', 'Job B'] ..."
   */
  const renderFormattedError = (error: string | null) => {
    if (!error) return null;

    // Get job names
    const jobMatch = error.match(/active job\(s\): \[(.*?)\]/i);
    if (!jobMatch) return error;

    // Get department delete main message
    const mainMessage = error.split(/active job\(s\):/i)[0].trim();
    const jobNamesStr = jobMatch[1];

    // Simple parser for comma-separated job names: [Job A, Job B]
    const jobNames = jobNamesStr
      .split(",")
      .map((name) => {
        let trimmed = name.trim();
        // remove quotes if they exist (for robustness)
        if (
          (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
          (trimmed.startsWith('"') && trimmed.endsWith('"'))
        ) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      })
      .filter(Boolean);

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{mainMessage}</p>
        </div>
        <div className="flex flex-wrap gap-2 pl-6">
          {jobNames.map((job, idx) => (
            <Badge key={idx} variant="outline">
              {job}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          Please deactivate or remove this department from these jobs before deleting.
        </p>
      </div>
    );
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
          <PermissionGuard permissions={PERMISSIONS.DEPARTMENTS_MANAGE} hideWhenDenied>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(row.original)}
              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permissions={PERMISSIONS.DEPARTMENTS_MANAGE} hideWhenDenied>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(row.original)}
              className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <AppPageShell width="wide">
      <PageHeader
        title="Department Management"

        actions={
          <PermissionGuard permissions={PERMISSIONS.DEPARTMENTS_MANAGE} hideWhenDenied>
            <Button onClick={handleCreateClick} className="rounded-xl px-6">
              Create Department
            </Button>
          </PermissionGuard>
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
        error={renderFormattedError(deleteError)}
        showFooterButtons={!deleteError}
      />
    </AppPageShell>
  );
};

export default AdminDepartments;
