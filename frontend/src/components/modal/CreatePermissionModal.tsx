/**
 * Modal component for creating new permissions.
 * Provides a form to input permission name and description.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Alert, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { adminPermissionService } from "../../apis/admin/service";
import { Button, Input } from "../../components/common";
import { permissionCreateSchema, type PermissionCreateFormValues } from "../../schemas/admin";

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
 * @example
 * ```tsx
 * <CreatePermissionModal
 *   show={showModal}
 *   handleClose={() => setShowModal(false)}
 *   onPermissionCreated={refreshPermissions}
 * />
 * ```
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
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Create New Permission</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form id="create-permission-form" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Permission Name"
            placeholder="e.g. users:write"
            {...register("name")}
            error={errors.name?.message}
            className="mb-3"
          />

          <Input
            label="Description"
            placeholder="Describe what this permission allows"
            {...register("description")}
            error={errors.description?.message}
            className="mb-3"
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" form="create-permission-form" isLoading={isLoading}>
          Create Permission
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePermissionModal;
