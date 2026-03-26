/**
 * Modal component for creating new permissions.
 * Provides a form to input permission name and description.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { adminPermissionService } from "@/apis/admin/service";
import { Button, Input } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { permissionCreateSchema, type PermissionCreateFormValues } from "@/schemas/admin";

/**
 * Props for the CreatePermissionModal component.
 */
interface CreatePermissionModalProps {
  /** Controls visibility of the modal */
  show: boolean;
  /** Callback to close the modal */
  handleClose: () => void;
  /** Callback fired after permission is successfully created */
  onPermissionCreated: () => void;
}

/**
 * Modal dialog for creating a new permission.
 */
const CreatePermissionModal = ({
  show,
  handleClose,
  onPermissionCreated,
}: CreatePermissionModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PermissionCreateFormValues>({
    resolver: zodResolver(permissionCreateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: PermissionCreateFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPermissionService.createPermission(data);
      onPermissionCreated();
      reset();
      handleClose();
    } catch (err: unknown) {
      let errorMsg = "Failed to create permission.";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const onHide = () => {
    reset();
    setError(null);
    handleClose();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Permission</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form id="create-permission-form" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Permission Name"
            placeholder="e.g. users:write"
            {...register("name")}
            error={errors.name?.message}
          />

          <Input
            label="Description"
            placeholder="Describe what this permission allows"
            {...register("description")}
            error={errors.description?.message}
            className="mt-3"
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onHide} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="create-permission-form" isLoading={isLoading}>
            Create Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePermissionModal;
