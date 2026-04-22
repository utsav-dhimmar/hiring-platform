/**
 * Admin page for managing job priorities.
 * Displays all job priorities with ability to create, edit, and delete.
 */
import { useState, useEffect, useCallback } from "react";
import { adminJobPriorityService } from "@/apis/admin";
import type { JobPriorityRead } from "@/types/admin";
import AppPageShell from "@/components/shared/AppPageShell";
import PageHeader from "@/components/shared/PageHeader";
import { useToast } from "@/components/shared/ToastProvider";
import { DataTable } from "@/components/shared/DataTable";
import ErrorDisplay from "@/components/shared/ErrorDisplay";
import { CreateJobPriorityModal, DeleteModal } from "@/components/modal";
import { Edit2, Trash2Icon, ArrowUpDown, Clock } from "lucide-react";
import { extractErrorMessage } from "@/utils/error";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/lib/permissions";
import { DateDisplay } from "@/components/shared";

const AdminJobPriorities = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<JobPriorityRead | null>(null);
  const [priorities, setPriorities] = useState<JobPriorityRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchPriorities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminJobPriorityService.getAllPriorities();
      setPriorities(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JobPriorityRead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (priority: JobPriorityRead) => {
    setItemToDelete(priority);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await adminJobPriorityService.deletePriority(itemToDelete.id);
      toast.success("Priority deleted successfully");
      fetchPriorities();
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleCreateClick = () => {
    setSelectedPriority(null);
    setShowModal(true);
  };

  const handleEditClick = (priority: JobPriorityRead) => {
    setSelectedPriority(priority);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPriority(null);
  };

  const columns: ColumnDef<JobPriorityRead>[] = [
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
      accessorKey: "duration_days",
      // header: "Duration (Days)",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Duration (Days)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.duration_days} days</span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      // header: "Created At",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),

      cell: ({ row }) => <div className="flex items-center gap-2">
        <DateDisplay date={row.original.created_at} />
      </div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <PermissionGuard permissions={PERMISSIONS.ADMIN_ACCESS} hideWhenDenied>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(row.original)}
              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permissions={PERMISSIONS.ADMIN_ACCESS} hideWhenDenied>
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

  const filteredPriorities = priorities.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppPageShell width="wide">
      <PageHeader
        title="Job Priorities"
        subtitle="Manage job priorities and their durations for the hiring platform."
        actions={
          <PermissionGuard permissions={PERMISSIONS.ADMIN_ACCESS} hideWhenDenied>
            <Button onClick={handleCreateClick} className="rounded-xl px-6">
              Create Priority
            </Button>
          </PermissionGuard>
        }
      />

      {error ? (
        <ErrorDisplay message={error} onRetry={fetchPriorities} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPriorities}
          loading={loading}
          searchKey="name"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Filter priorities by name..."
          initialSorting={[{ id: "name", desc: false }]}
          entityName="Priorities"
          totalCount={priorities.length}
          resultCount={filteredPriorities.length}
        />
      )}

      <CreateJobPriorityModal
        show={showModal}
        handleClose={handleCloseModal}
        onPrioritySaved={fetchPriorities}
        priority={selectedPriority}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleConfirmDelete}
        title="Delete Priority"
        message={`Are you sure you want to delete priority "${itemToDelete?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </AppPageShell>
  );
};

export default AdminJobPriorities;
