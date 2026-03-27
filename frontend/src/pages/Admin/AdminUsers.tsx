/**
 * Admin page for managing users.
 * Displays all users with ability to create new users.
 */

import { useState } from "react";
import { adminUserService } from "@/apis/admin/service";
import type { UserAdminRead } from "@/types/admin";
import {

  DateDisplay,
  PageHeader,
  StatusBadge,
  useToast,
  ErrorDisplay,
  DataTable,
} from "@/components/shared";
import { CreateUserModal, DeleteModal } from "@/components/modal";
import { useAdminData, useDeleteConfirmation } from "@/hooks";

import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components";

const AdminUsers = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAdminRead | null>(null);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: users,
    loading,
    error,
    fetchData: fetchUsers,
  } = useAdminData<UserAdminRead>(() => adminUserService.getAllUsers(0, 100));

  const {
    showModal: showDeleteModal,
    handleDeleteClick,
    handleClose: handleCloseDelete,
    handleConfirm: handleConfirmDelete,
    isDeleting,
    error: deleteError,
    message: deleteMessage,
  } = useDeleteConfirmation<UserAdminRead>({
    deleteFn: (id) => adminUserService.deleteUser(id as string),
    onSuccess: () => {
      fetchUsers();
      toast.success("User deleted successfully");
    },
    itemTitle: (user) => `user "${user.full_name || user.email}"`,
  });

  const handleCreateClick = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditClick = (user: UserAdminRead) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const columns: ColumnDef<UserAdminRead>[] = [
    {
      accessorKey: "full_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span>{row.original.full_name || "N/A"}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.is_active} />,
    },
    {
      accessorKey: "role_id",
      header: "Role ID",
      cell: ({ row }) => (
        <small
          className="text-muted-foreground truncate block max-w-[100px]"
          title={row.original.role_id}
        >
          {row.original.role_id}
        </small>
      ),
    },
    {
      accessorKey: "created_at",
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
      cell: ({ row }) => <DateDisplay date={row.original.created_at} showTime={false} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex gap-2 justify-end items-center flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => handleEditClick(user)}
            >
              Edit
            </Button>
            {user.full_name !== "System Admin" && (
              <Button
                variant="destructive"
                size="sm"
                className="flex-shrink-0"
                onClick={() => handleDeleteClick(user)}
              >
                Delete
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 pt-0 pb-8">
      <PageHeader
        title="User Management"
        actions={<Button onClick={handleCreateClick}>Create User</Button>}
      />

      {loading ? (
        <div className="w-full h-64 bg-muted animate-pulse rounded-2xl" />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchUsers} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchKey="full_name"
          searchPlaceholder="Search users..."
          initialSorting={[
            { id: "is_active", desc: true },
            { id: "created_at", desc: true },
          ]}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={setPagination}
        />
      )}

      <CreateUserModal
        show={showModal}
        handleClose={handleCloseModal}
        onUserSaved={fetchUsers}
        user={selectedUser}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete User"
        message={deleteMessage}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminUsers;
