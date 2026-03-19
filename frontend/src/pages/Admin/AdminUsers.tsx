/**
 * Admin page for managing users.
 * Displays all users with ability to create new users.
 */

import { useEffect, useState, useCallback } from "react";
import { adminUserService } from "../../apis/admin/service";
import type { UserAdminRead } from "../../apis/admin/types";
import { Card, CardBody, Button, DateDisplay, DeleteModal } from "../../components/common";
import CreateUserModal from "./CreateUserModal";
import axios from "axios";
import "./AdminDashboard.css"; // Reuse some table styles

const AdminUsers = () => {
  const [users, setUsers] = useState<UserAdminRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAdminRead | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAdminRead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleDeleteClick = (user: UserAdminRead) => {
    setUserToDelete(user);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminUserService.deleteUser(userToDelete.id);
      await fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: unknown) {
      let errorMsg = "Failed to delete user.";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setDeleteError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && users.length === 0) return <div className="admin-loading">Loading users...</div>;
  if (error && users.length === 0) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Management</h1>
        <Button variant="primary" onClick={handleCreateClick}>
          Create User
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Role ID</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name || "N/A"}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`badge bg-${user.is_active ? "success" : "danger"}`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <small>{user.role_id}</small>
                    </td>
                    <td>
                      <DateDisplay date={user.created_at} showTime={false} />
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </Button>
                      {user.full_name !== "System Admin" && (
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <CreateUserModal
        show={showModal}
        handleClose={handleCloseModal}
        onUserSaved={fetchUsers}
        user={selectedUser}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.full_name || userToDelete?.email}"? This action cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminUsers;
