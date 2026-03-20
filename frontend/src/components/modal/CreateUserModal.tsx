/**
 * Modal component for creating new users in the admin panel.
 * Provides a form with role selection to create user accounts.
 */

import { useCallback, useEffect, useState } from "react";
import { Col, Form, Modal, Row } from "react-bootstrap";
import { adminRoleService, adminUserService } from "../../apis/admin/service";
import type { RoleRead, UserAdminRead } from "../../apis/admin/types";
import { Button, ErrorDisplay, Input } from "../../components/common";
import { useFormModal } from "../../hooks";
import { userCreateSchema, type UserCreateFormValues } from "../../schemas/admin";

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
      password: "", // Password is not returned from API
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
    <Modal show={show} onHide={handleClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Edit User" : "Create New User"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {submitError && <ErrorDisplay message={submitError} />}

        <Form onSubmit={handleSubmit} id="create-user-form">
          <Row>
            <Col md={6}>
              <Input
                label="Full Name"
                placeholder="Enter full name"
                {...register("full_name")}
                error={errors.full_name?.message}
                className="mb-3"
              />
            </Col>
            <Col md={6}>
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter email"
                {...register("email")}
                error={errors.email?.message}
                className="mb-3"
                disabled={isEditMode}
              />
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              {!isEditMode && (
                <Input
                  label="Password (Optional)"
                  type="password"
                  placeholder="Enter password"
                  {...register("password")}
                  error={errors.password?.message}
                  className="mb-3"
                />
              )}
              {isEditMode && (
                <div className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Password cannot be changed here"
                    disabled
                    readOnly
                  />
                  <small className="text-muted">
                    Passwords must be reset via forgot password or a separate dedicated endpoint.
                  </small>
                </div>
              )}
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  {...register("role_id")}
                  isInvalid={!!errors.role_id}
                  disabled={fetchingRoles}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Form.Select>
                {errors.role_id && (
                  <Form.Control.Feedback type="invalid">
                    {errors.role_id.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Check type="checkbox" label="Active User" {...register("is_active")} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" form="create-user-form" isLoading={isSubmitting}>
          {isEditMode ? "Update User" : "Create User"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateUserModal;
