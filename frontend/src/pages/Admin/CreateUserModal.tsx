/**
 * Modal component for creating new users in the admin panel.
 * Provides a form with role selection to create user accounts.
 */

import { useState, useEffect } from "react";
import { Modal, Form, Alert, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminUserService, adminRoleService } from "../../apis/admin/service";
import type { RoleRead, UserAdminRead } from "../../apis/admin/types";
import { userCreateSchema, type UserCreateFormValues } from "../../schemas/admin";
import { Input, Button } from "../../components/common";
import axios from "axios";

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

/**
 * Modal dialog for creating or editing a user account.
 */
const CreateUserModal = ({ show, handleClose, onUserSaved, user }: CreateUserModalProps) => {
  const [roles, setRoles] = useState<RoleRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const isEditMode = !!user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      is_active: true,
      role_id: "",
    },
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
          setError("Failed to load roles. Please try again.");
        } finally {
          setFetchingRoles(false);
        }
      };
      fetchRoles();

      if (user) {
        reset({
          full_name: user.full_name || "",
          email: user.email,
          is_active: user.is_active,
          role_id: user.role_id,
          password: "", // Password is not returned from API
        });
      } else {
        reset({
          full_name: "",
          email: "",
          is_active: true,
          role_id: "",
          password: "",
        });
      }
    } else {
      setError(null);
    }
  }, [show, reset, user]);

  const onSubmit = async (data: UserCreateFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isEditMode && user) {
        // For editing, we use the update schema fields
        const updateData = {
          full_name: data.full_name,
          is_active: data.is_active,
          role_id: data.role_id,
        };
        await adminUserService.updateUser(user.id, updateData);
      } else {
        // Clean up empty password if not provided
        const payload = { ...data };
        if (!payload.password) {
          delete payload.password;
        }
        await adminUserService.createUser(payload);
      }
      onUserSaved();
      handleClose();
    } catch (err: unknown) {
      let errorMsg = `Failed to ${isEditMode ? "update" : "create"} user.`;
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

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Edit User" : "Create New User"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        
        <Form onSubmit={handleSubmit(onSubmit)}>
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
                disabled={isEditMode} // Usually email is not editable
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
                  <small className="text-muted">Passwords must be reset via forgot password or a separate dedicated endpoint.</small>
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
            <Form.Check
              type="checkbox"
              label="Active User"
              {...register("is_active")}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="outline-secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {isEditMode ? "Update User" : "Create User"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateUserModal;
