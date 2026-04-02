/**
 * Admin page for managing roles and permissions.
 * Displays all roles and permissions with ability to create new permissions.
 */

import { useCallback, useState } from "react";
import { adminPermissionService, adminRoleService } from "@/apis/admin/service";
import type { PermissionRead, RoleRead } from "@/types/admin";
import {
  AdminDataTable,
  AppPageShell,
  DateDisplay,
  PageHeader,
  type Column,
} from "@/components/shared";
import { CreatePermissionModal, DeleteModal, RoleModal } from "@/components/modal";
import { useAdminData, useDeleteConfirmation } from "@/hooks";
import { Button } from "@/components/ui/button";

const AdminRoles = () => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [roles, permissions] = await Promise.all([
      adminRoleService.getAllRoles(),
      adminPermissionService.getAllPermissions(),
    ]);
    return { roles, permissions };
  }, []);

  const {
    data: combinedData,
    loading,
    error,
    fetchData,
  } = useAdminData<{ roles: RoleRead[]; permissions: PermissionRead[] }>(
    async () => {
      const data = await fetchAll();
      return [data]; // useAdminData expects an array
    },
    { initialData: [{ roles: [], permissions: [] }] },
  );

  const roles = combinedData[0]?.roles || [];
  const permissions = combinedData[0]?.permissions || [];

  // Two separate delete hooks for clarity.
  const roleDelete = useDeleteConfirmation<RoleRead>({
    deleteFn: (id) => adminRoleService.deleteRole(id as string),
    onSuccess: fetchData,
    itemTitle: (role) => `role "${role.name}"`,
  });

  const permissionDelete = useDeleteConfirmation<PermissionRead>({
    deleteFn: (id) => adminPermissionService.deletePermission(id as string),
    onSuccess: fetchData,
    itemTitle: (perm) => `permission "${perm.name}"`,
  });

  const handleCreateRole = () => {
    setEditingRoleId(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (roleId: string) => {
    setEditingRoleId(roleId);
    setShowRoleModal(true);
  };

  const roleColumns: Column<RoleRead>[] = [
    {
      header: "Role Name",
      accessor: (role) => <strong>{role.name}</strong>,
    },
    {
      header: "Created At",
      accessor: (role) => <DateDisplay date={role.created_at} showTime={false} />,
    },
    {
      header: "Actions",
      accessor: (role) => (
        <>
          <Button
            variant="outline"
            size="sm"
            className="me-2"
            onClick={() => handleEditRole(role.id)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => roleDelete.handleDeleteClick(role)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  const permissionColumns: Column<PermissionRead>[] = [
    {
      header: "Name",
      accessor: (perm) => (
        <>
          <code>{perm.name}</code>
          <div className="text-muted small">{perm.description}</div>
        </>
      ),
    },
    {
      header: "Actions",
      accessor: (perm) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => permissionDelete.handleDeleteClick(perm)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <AppPageShell width="wide">
      <PageHeader
        title="Role & Permission Management"
        mobileMenuTrigger
        actions={
          <>
            <Button variant="outline" onClick={() => setShowPermissionModal(true)}>
              Create Permission
            </Button>
            <Button onClick={handleCreateRole}>Create Role</Button>
          </>
        }
      />

      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Roles</h2>
          <AdminDataTable
            columns={roleColumns}
            data={roles}
            loading={loading}
            error={error}
            onRetry={fetchData}
            rowKey="id"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Permissions</h2>
          <AdminDataTable
            columns={permissionColumns}
            data={permissions}
            loading={loading}
            error={error}
            onRetry={fetchData}
            rowKey="id"
          />
        </div>
      </div>

      <CreatePermissionModal
        show={showPermissionModal}
        handleClose={() => setShowPermissionModal(false)}
        onPermissionCreated={fetchData}
      />

      <RoleModal
        show={showRoleModal}
        handleClose={() => setShowRoleModal(false)}
        onSuccess={fetchData}
        editRoleId={editingRoleId}
      />

      <DeleteModal
        show={roleDelete.showModal}
        handleClose={roleDelete.handleClose}
        handleConfirm={roleDelete.handleConfirm}
        title="Delete Role"
        message={roleDelete.message}
        isLoading={roleDelete.isDeleting}
        error={roleDelete.error}
      />

      <DeleteModal
        show={permissionDelete.showModal}
        handleClose={permissionDelete.handleClose}
        handleConfirm={permissionDelete.handleConfirm}
        title="Delete Permission"
        message={permissionDelete.message}
        isLoading={permissionDelete.isDeleting}
        error={permissionDelete.error}
      />
    </AppPageShell>
  );
};

export default AdminRoles;
