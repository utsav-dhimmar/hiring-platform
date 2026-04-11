/**
 * Modal component for creating new users in the admin panel.
 * Provides a form with role selection to create user accounts.
 * Uses Zod for form validation and shadcn components.
 */

import { useCallback, useEffect, useState } from "react";
import { adminRoleService, adminUserService } from "@/apis/admin/service";
import type { RoleRead, UserAdminRead } from "@/types/admin";
import ErrorDisplay from "@/components/shared/ErrorDisplay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Button,
  Input,
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
  Switch,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components";
import { useFormModal } from "@/hooks";
import { userCreateSchema, type UserCreateFormValues } from "@/schemas/admin";

/**
 * Props for the CreateUserModal component.
 */
interface CreateUserModalProps {
  show: boolean;
  handleClose: () => void;
  onUserSaved: () => void;
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

  const formModal = useFormModal<UserCreateFormValues, UserAdminRead>({
    schema: userCreateSchema,
    defaultValues: DEFAULT_USER_VALUES,
    item: user || null,
    show,
    mapItemToValues,
    onSubmit,
  });

  const {
    handleFormSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
    control,
  } = formModal;

  useEffect(() => {
    if (show) {
      const fetchRoles = async () => {
        try {
          setFetchingRoles(true);
          const data = await adminRoleService.getAllRoles();
          setRoles(data.data);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>

        {submitError && <ErrorDisplay message={submitError} />}

        <Form {...formModal}>
          <form id="create-user-form" onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        disabled={isEditMode}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* {!isEditMode ? (
                <FormField
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Password cannot be changed here" disabled className="bg-muted" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Passwords must be reset via forgot password or a dedicated endpoint.
                  </p>
                </FormItem>
              )} */}

              <FormField
                control={control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={fetchingRoles}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role">
                            {roles.find((r) => r.id === field.value)?.name || user?.role_name}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Account</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable this user's access to the platform.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

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
