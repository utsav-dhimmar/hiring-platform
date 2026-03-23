/**
 * Custom hook for managing delete confirmation dialogs.
 * Provides state and handlers for showing a confirmation modal before deletion.
 */

import { useState, useCallback } from "react";
import { extractErrorMessage } from "@/utils/error";

/**
 * Options for configuring the useDeleteConfirmation hook.
 * @typeParam T - The type of item being deleted
 */
interface UseDeleteConfirmationOptions<T> {
  /** Optional callback fired after successful deletion */
  onSuccess?: () => void;
  /** Async function to perform the delete operation */
  deleteFn: (id: string | number) => Promise<void>;
  /** Function to generate display title from item (default: "this item") */
  itemTitle?: (item: T) => string;
}

/**
 * Hook for managing delete confirmation modal state.
 * @param options - Configuration options including delete function and callbacks
 * @returns State and handlers for the delete confirmation dialog
 * @example
 * ```ts
 * const { showModal, handleDeleteClick, handleConfirm, isDeleting, error } = useDeleteConfirmation({
 *   deleteFn: (id) => deleteUser(id),
 *   onSuccess: () => refetchUsers(),
 *   itemTitle: (user) => user.name,
 * });
 */
export const useDeleteConfirmation = <T extends { id: string | number }>(
  options: UseDeleteConfirmationOptions<T>,
) => {
  const { onSuccess, deleteFn, itemTitle = () => "this item" } = options;
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = useCallback((item: T) => {
    setItemToDelete(item);
    setError(null);
    setShowModal(true);
  }, []);

  const handleClose = useCallback(() => {
    if (!isDeleting) {
      setShowModal(false);
      setItemToDelete(null);
    }
  }, [isDeleting]);

  const handleConfirm = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      setError(null);
      await deleteFn(itemToDelete.id);
      setShowModal(false);
      setItemToDelete(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to delete item."));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteFn, itemToDelete, onSuccess]);

  return {
    showModal,
    itemToDelete,
    isDeleting,
    error,
    handleDeleteClick,
    handleClose,
    handleConfirm,
    message: itemToDelete
      ? `Are you sure you want to delete ${itemTitle(itemToDelete)}? This action cannot be undone.`
      : "",
  };
};
