/**
 * Modal component for creating new users in the admin panel.
 * Provides a form with role selection to create user accounts.
 */

import { useCallback, useEffect, useState } from "react";
import { adminRoleService, adminUserService } from "@/apis/admin/service";
import type { RoleRead, UserAdminRead } from "@/types/admin";
import { Button, ErrorDisplay, Input } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFormModal } from "@/hooks";
import { userCreateSchema, type UserCreateFormValues } from "@/schemas/admin";

/**
 * Props for the CreateUserModal component.
 */
interface CreateUserModalProps {
  /** Controls visibility of the modal */
  show: boolean;
  /** Callback to close the modal */
  handleClose: () => void;
  /** Callback fired after user is successfully created or updated */
  onUserSaved: () => void;
  /** Optional user data for editing mode */
  user?: UserAdminRead | null;
}

const DEFAULT_USER_VALUES: UserCreateFormValues = {
  is_active: true,
  role_id: "",
  full_name: "",
  email: "",
  password: "",
};

/**
 * Modal dialog for creating or editing a user account.
 */
const CreateUserModal = ({ show, handleClose, onUserSaved, user }: CreateUserModalProps) => {
  const [roles, setRoles] = useState<RoleRead[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const isEditMode = !!user;

  const mapItemToValues = useCallback(
    (u: UserAdminRead): UserCreateFormValues => ({
      full_name: u.full_name || "",
      email: u.email,
      is_active: u.is_active,
      role_id: u.role_id,
      password: "",
    }),
    [],
  );

  const onSubmit = useCallback(
    async (data: UserCreateFormValues) => {
      if (isEditMode && user) {
        const updateData = {
          full_name: data.full_name,
          is_active: data.is_active,
          role_id: data.role_id,
        };
        await adminUserService.updateUser(user.id, updateData);
      } else {
        const payload = { ...data };
        if (!payload.password) {
          delete payload.password;
        }
        await adminUserService.createUser(payload);
      }
      onUserSaved();
      handleClose();
    },
    [isEditMode, user, onUserSaved, handleClose],
  );

  const {
    register,
    handleSubmit,
    isSubmitting,
    submitError,
    formState: { errors },
    setSubmitError,
  } = useFormModal<UserCreateFormValues, UserAdminRead>({
    schema: userCreateSchema,
    defaultValues: DEFAULT_USER_VALUES,
    item: user || null,
    show,
    mapItemToValues,
    onSubmit,
  });

  useEffect(() => {
    if (show) {
      const fetchRoles = async () => {
        try {
          setFetchingRoles(true);
          const data = await adminRoleService.getAllRoles();
          setRoles(data);
        } catch (err) {
          console.error("Failed to fetch roles:", err);
          setSubmitError("Failed to load roles. Please try again.");
        } finally {
          setFetchingRoles(false);
        }
      };
      fetchRoles();
    }
  }, [show, setSubmitError]);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>
        {submitError && <ErrorDisplay message={submitError} />}

        <form id="create-user-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              {...register("full_name")}
              error={errors.full_name?.message}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter email"
              {...register("email")}
              error={errors.email?.message}
              disabled={isEditMode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {!isEditMode && (
              <Input
                label="Password (Optional)"
                type="password"
                placeholder="Enter password"
                {...register("password")}
                error={errors.password?.message}
              />
            )}
            {isEditMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="text"
                  className="w-full h-10 rounded-md border border-input bg-muted px-3 py-2"
                  placeholder="Password cannot be changed here"
                  disabled
                  readOnly
                />
                <small className="text-muted-foreground">
                  Passwords must be reset via forgot password or a separate dedicated endpoint.
                </small>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 ${errors.role_id ? "border-destructive" : ""}`}
                {...register("role_id")}
                disabled={fetchingRoles}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.role_id && (
                <p className="text-sm text-destructive">{errors.role_id.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="is_active"
              {...register("is_active")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm">Active User</label>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" isLoading={isSubmitting}>
            {isEditMode ? "Update User" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
