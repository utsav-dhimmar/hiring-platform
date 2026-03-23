/**
 * Admin page for managing users.
 * Displays all users with ability to create new users.
 */

import { useState } from "react";
import { adminUserService } from "@/apis/admin/service";
import type { UserAdminRead } from "@/types/admin";
import {
  AdminDataTable,
  Button,
  DateDisplay,
  PageHeader,
  StatusBadge,
  useToast,
  type Column,
} from "@/components/shared";
import { CreateUserModal, DeleteModal } from "@/components/modal";
import "@/css/adminDashboard.css";
import { useAdminData, useDeleteConfirmation } from "@/hooks";

const AdminUsers = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAdminRead | null>(null);

  const {
    data: users,
    loading,
    error,
    fetchData: fetchUsers,
  } = useAdminData<UserAdminRead>(() => adminUserService.getAllUsers());

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

  const columns: Column<UserAdminRead>[] = [
    { header: "Full Name", accessor: (user) => user.full_name || "N/A" },
    { header: "Email", accessor: "email" },
    {
      header: "Status",
      accessor: (user) => <StatusBadge status={user.is_active} />,
    },
    {
      header: "Role ID",
      accessor: (user) => <small>{user.role_id}</small>,
    },
    {
      header: "Created At",
      accessor: (user) => <DateDisplay date={user.created_at} showTime={false} />,
    },
    {
      header: "Actions",
      className: "text-end text-nowrap",
      style: { width: "200px", minWidth: "200px" },
      accessor: (user) => (
        <div className="d-flex gap-2 justify-content-end align-items-center flex-nowrap">
          <Button
            variant="outline-primary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => handleEditClick(user)}
          >
            Edit
          </Button>
          {user.full_name !== "System Admin" && (
            <Button
              variant="outline-danger"
              size="sm"
              className="flex-shrink-0"
              onClick={() => handleDeleteClick(user)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="admin-dashboard">
      <PageHeader
        title="User Management"
        actions={
          <Button variant="primary" onClick={handleCreateClick}>
            Create User
          </Button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        onRetry={fetchUsers}
        rowKey="id"
        emptyMessage="No users found."
      />

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
