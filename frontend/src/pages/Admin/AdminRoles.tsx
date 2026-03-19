/**
 * Admin page for managing roles and permissions.
 * Displays all roles and permissions with ability to create new permissions.
 */

import { useEffect, useState, useCallback } from "react";
import {
  adminRoleService,
  adminPermissionService,
} from "../../apis/admin/service";
import type { RoleRead, PermissionRead } from "../../apis/admin/types";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  DateDisplay,
  DeleteModal,
} from "../../components/common";
import CreatePermissionModal from "../../components/admin/CreatePermissionModal";
import RoleModal from "../../components/admin/RoleModal";
import axios from "axios";
import "../../css/adminDashboard.css";

const AdminRoles = () => {
  const [roles, setRoles] = useState<RoleRead[]>([]);
  const [permissions, setPermissions] = useState<PermissionRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Delete modal state
  const [deleteConfig, setDeleteConfig] = useState<{
    show: boolean;
    type: "role" | "permission";
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        adminRoleService.getAllRoles(),
        adminPermissionService.getAllPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err) {
      console.error("Failed to fetch roles/permissions:", err);
      setError("Failed to load roles and permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePermissionCreated = () => {
    fetchData();
  };

  const handleRoleSuccess = () => {
    fetchData();
  };

  const handleCreateRole = () => {
    setEditingRoleId(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (roleId: string) => {
    setEditingRoleId(roleId);
    setShowRoleModal(true);
  };

  const handleDeleteClick = (
    type: "role" | "permission",
    id: string,
    name: string,
  ) => {
    setDeleteConfig({ show: true, type, id, name });
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfig) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (deleteConfig.type === "role") {
        await adminRoleService.deleteRole(deleteConfig.id);
      } else {
        await adminPermissionService.deletePermission(deleteConfig.id);
      }
      await fetchData();
      setDeleteConfig(null);
    } catch (err: unknown) {
      let errorMsg = `Failed to delete ${deleteConfig.type}.`;
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

  if (loading && roles.length === 0)
    return (
      <div className="admin-loading">Loading roles and permissions...</div>
    );
  if (error && roles.length === 0)
    return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Role & Permission Management</h1>
        <div>
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={() => setShowPermissionModal(true)}
          >
            Create Permission
          </Button>
          <Button variant="primary" onClick={handleCreateRole}>
            Create Role
          </Button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-7">
          <Card>
            <CardHeader>Roles</CardHeader>
            <CardBody>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <strong>{role.name}</strong>
                      </td>
                      <td>
                        <DateDisplay date={role.created_at} showTime={false} />
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditRole(role.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() =>
                            handleDeleteClick("role", role.id, role.name)
                          }
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        <div className="col-md-5">
          <Card>
            <CardHeader>Permissions</CardHeader>
            <CardBody>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm) => (
                    <tr key={perm.id}>
                      <td>
                        <code>{perm.name}</code>
                        <div className="text-muted small">
                          {perm.description}
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() =>
                            handleDeleteClick("permission", perm.id, perm.name)
                          }
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      </div>

      <CreatePermissionModal
        show={showPermissionModal}
        handleClose={() => setShowPermissionModal(false)}
        onPermissionCreated={handlePermissionCreated}
      />

      <RoleModal
        show={showRoleModal}
        handleClose={() => setShowRoleModal(false)}
        onSuccess={handleRoleSuccess}
        editRoleId={editingRoleId}
      />

      <DeleteModal
        show={!!deleteConfig}
        handleClose={() => setDeleteConfig(null)}
        handleConfirm={handleConfirmDelete}
        title={`Delete ${deleteConfig?.type === "role" ? "Role" : "Permission"}`}
        message={`Are you sure you want to delete the ${deleteConfig?.type} "${deleteConfig?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminRoles;
