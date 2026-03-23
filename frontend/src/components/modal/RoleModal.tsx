/**
 * Modal component for creating and editing roles.
 * Provides a form to input role name and select permissions.
 */

import { useCallback, useEffect, useState } from "react";
import { Col, Form, Modal, Row } from "react-bootstrap";
import { adminPermissionService, adminRoleService } from "@/apis/admin/service";
import type { PermissionRead } from "@/types/admin";
import { Button, ErrorDisplay, Input } from "@/components/shared";
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
        // Fetch all permissions for the checklist
        const permsData = await adminPermissionService.getAllPermissions();
        setPermissions(permsData);

        // If in edit mode, fetch role details
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
    <Modal show={show} onHide={onHide} centered size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Edit Role" : "Create New Role"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {submitError && <ErrorDisplay message={submitError} />}

        {fetchingData ? (
          <div className="text-center p-5">
            <p>Loading data...</p>
          </div>
        ) : (
          <Form id="role-form" onSubmit={handleSubmit}>
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
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" form="role-form" isLoading={isSubmitting}>
          {isEditMode ? "Update Role" : "Create Role"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RoleModal;
