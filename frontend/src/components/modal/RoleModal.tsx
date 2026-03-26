/**
 * Modal component for creating and editing roles.
 * Provides a form to input role name and select permissions.
 */

import { useCallback, useEffect, useState } from "react";
import { adminPermissionService, adminRoleService } from "@/apis/admin/service";
import type { PermissionRead } from "@/types/admin";
import { Button, ErrorDisplay, Input } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFormModal } from "@/hooks";
import { roleCreateSchema, type RoleCreateFormValues } from "@/schemas/admin";

/**
 * Props for the RoleModal component.
 */
interface RoleModalProps {
  /** Controls visibility of the modal */
  show: boolean;
  /** Callback to close the modal */
  handleClose: () => void;
  /** Callback fired after role is successfully created or updated */
  onSuccess: () => void;
  /** ID of the role to edit (if in edit mode) */
  editRoleId?: string | null;
}

const DEFAULT_ROLE_VALUES: RoleCreateFormValues = {
  name: "",
  permission_ids: [],
};

/**
 * Modal dialog for creating or editing a role.
 */
const RoleModal = ({ show, handleClose, onSuccess, editRoleId }: RoleModalProps) => {
  const [permissions, setPermissions] = useState<PermissionRead[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  const isEditMode = !!editRoleId;

  const onSubmit = useCallback(
    async (data: RoleCreateFormValues) => {
      if (editRoleId) {
        await adminRoleService.updateRole(editRoleId, data);
      } else {
        await adminRoleService.createRole(data);
      }
      onSuccess();
      handleClose();
    },
    [editRoleId, onSuccess, handleClose],
  );

  const {
    register,
    handleSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
    reset,
    setValue,
    formState: { errors },
  } = useFormModal<RoleCreateFormValues, any>({
    schema: roleCreateSchema,
    defaultValues: DEFAULT_ROLE_VALUES,
    show,
    onSubmit,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!show) return;

      setFetchingData(true);
      setSubmitError(null);
      try {
        const permsData = await adminPermissionService.getAllPermissions();
        setPermissions(permsData);

        if (editRoleId) {
          const roleData = await adminRoleService.getRoleById(editRoleId);
          setValue("name", roleData.name);
          setValue(
            "permission_ids",
            roleData.permissions.map((p) => p.id),
          );
        } else {
          reset({
            name: "",
            permission_ids: [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setSubmitError("Failed to load required data.");
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [show, editRoleId, setValue, reset, setSubmitError]);

  const onHide = () => {
    setSubmitError(null);
    handleClose();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Role" : "Create New Role"}</DialogTitle>
        </DialogHeader>
        {submitError && <ErrorDisplay message={submitError} />}

        {fetchingData ? (
          <div className="text-center p-5">
            <p>Loading data...</p>
          </div>
        ) : (
          <form id="role-form" onSubmit={handleSubmit}>
            <Input
              label="Role Name"
              placeholder="e.g. Moderator"
              {...register("name")}
              error={errors.name?.message}
              className="mb-4"
            />

            <h5 className="mb-3">Assign Permissions</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={`perm-${permission.id}`}
                    value={permission.id}
                    {...register("permission_ids")}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor={`perm-${permission.id}`} className="text-sm">
                    <strong>{permission.name}</strong>
                    <br />
                    <span className="text-muted-foreground">{permission.description}</span>
                  </label>
                </div>
              ))}
            </div>
            {errors.permission_ids && (
              <div className="text-red-500 text-sm mt-2">{errors.permission_ids.message}</div>
            )}
          </form>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onHide} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="role-form" isLoading={isSubmitting}>
            {isEditMode ? "Update Role" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleModal;
