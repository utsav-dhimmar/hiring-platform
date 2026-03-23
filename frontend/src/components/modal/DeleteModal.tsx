/**
 * A reusable confirmation modal for delete actions.
 * Displays a title, message, and confirmation/cancel buttons.
 */

import { Alert, Modal } from "react-bootstrap";
import { Button } from "@/components/shared";

/**
 * Props for the DeleteModal component.
 */
interface DeleteModalProps {
  /** Controls visibility of the modal */
  show: boolean;
  /** Callback to close the modal */
  handleClose: () => void;
  /** Callback fired when the delete is confirmed */
  handleConfirm: () => void;
  /** The title of the modal */
  title: string;
  /** The message/body of the modal */
  message: string;
  /** Text for the confirm button (default: "Delete") */
  confirmButtonText?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelButtonText?: string;
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
  /** Error message to display (if any) */
  error?: string | null;
  /** Variant for the confirm button (default: "danger") */
  confirmVariant?: "danger" | "primary" | "warning";
}

/**
 * Reusable modal for confirming destructive delete actions.
 * @example
 * ```tsx
 * <DeleteModal
 *   show={showModal}
 *   handleClose={() => setShowModal(false)}
 *   handleConfirm={handleDelete}
 *   title="Delete User"
 *   message="Are you sure you want to delete this user?"
 *   isLoading={isDeleting}
 * />
 * ```
 */
const DeleteModal = ({
  show,
  handleClose,
  handleConfirm,
  title,
  message,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
  isLoading = false,
  error = null,
  confirmVariant = "danger",
}: DeleteModalProps) => {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose} disabled={isLoading}>
          {cancelButtonText}
        </Button>
        <Button variant={confirmVariant} onClick={handleConfirm} isLoading={isLoading}>
          {confirmButtonText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteModal;
