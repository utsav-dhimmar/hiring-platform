/**
 * Modal component for creating and editing roles.
 * Provides a form to input role name and select permissions.
 */

import { useState, useEffect } from "react";
import { Modal, Form, Alert, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminRoleService, adminPermissionService } from "../../apis/admin/service";
import type { PermissionRead } from "../../apis/admin/types";
import { roleCreateSchema, type RoleCreateFormValues } from "../../schemas/admin";
import { Input, Button } from "../../components/common";
import axios from "axios";

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

/**
 * Modal dialog for creating or editing a role.
 */
const RoleModal = ({ 
  show, 
  handleClose, 
  onSuccess,
  editRoleId
}: RoleModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<PermissionRead[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  const isEditMode = !!editRoleId;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoleCreateFormValues>({
    resolver: zodResolver(roleCreateSchema),
    defaultValues: {
      name: "",
      permission_ids: [],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!show) return;

      setFetchingData(true);
      setError(null);
      try {
        // Fetch all permissions for the checklist
        const permsData = await adminPermissionService.getAllPermissions();
        setPermissions(permsData);

        // If in edit mode, fetch role details
        if (editRoleId) {
          const roleData = await adminRoleService.getRoleById(editRoleId);
          setValue("name", roleData.name);
          setValue("permission_ids", roleData.permissions.map(p => p.id));
        } else {
          reset({
            name: "",
            permission_ids: [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load required data.");
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [show, editRoleId, setValue, reset]);

  const onSubmit = async (data: RoleCreateFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      if (editRoleId) {
        await adminRoleService.updateRole(editRoleId, data);
      } else {
        await adminRoleService.createRole(data);
      }
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      let errorMsg = `Failed to ${isEditMode ? "update" : "create"} role.`;
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
    setError(null);
    handleClose();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="modal-dialog-scrollable">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Edit Role" : "Create New Role"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        
        {fetchingData ? (
          <div className="text-center p-5">
            <p>Loading data...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Role Name"
              placeholder="e.g. Moderator"
              {...register("name")}
              error={errors.name?.message}
              className="mb-4"
            />

            <h5 className="mb-3">Assign Permissions</h5>
            <Row>
              {permissions.map((permission) => (
                <Col md={6} key={permission.id} className="mb-2">
                  <Form.Check 
                    type="checkbox"
                    id={`perm-${permission.id}`}
                    label={
                      <div>
                        <strong>{permission.name}</strong>
                        <br />
                        <small className="text-muted">{permission.description}</small>
                      </div>
                    }
                    value={permission.id}
                    {...register("permission_ids")}
                  />
                </Col>
              ))}
            </Row>
            {errors.permission_ids && (
              <div className="text-danger small mt-2">{errors.permission_ids.message}</div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={onHide} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {isEditMode ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default RoleModal;
