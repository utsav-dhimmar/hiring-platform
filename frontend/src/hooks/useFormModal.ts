/**
 * Custom hook for managing form state within a modal dialog.
 * Provides form handling, submission, and validation with Zod schemas.
 * @see https://react-hook-form.com/
 * @see https://zod.dev/
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, type FieldValues, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { extractErrorMessage } from "@/utils/error";

/**
 * Options for configuring the useFormModal hook.
 * @typeParam TFormValues - The form values type
 * @typeParam TItem - The item type being edited (if any)
 */
interface UseFormModalOptions<TFormValues extends FieldValues, TItem> {
  /** Zod schema for form validation */
  schema: ZodType<TFormValues>;
  /** Default values for the form fields */
  defaultValues: DefaultValues<TFormValues>;
  /** Callback function to handle form submission */
  onSubmit: (data: TFormValues) => Promise<void>;
  /** Optional callback fired after successful submission */
  onSuccess?: () => void;
  /** Existing item data for edit mode, null for create mode */
  item?: TItem | null;
  /** Controls visibility of the modal */
  show: boolean;
  /** Whether to reset form values when modal closes (default: true) */
  resetOnClose?: boolean;
  /** Function to map item data to form values */
  mapItemToValues?: (item: TItem) => TFormValues;
}

/**
 * Hook for managing form state in modal dialogs with Zod validation.
 * @param options - Configuration options for the form modal
 * @returns Form methods and state including submission status and error handling
 */
export const useFormModal = <TFormValues extends FieldValues, TItem>(
  options: UseFormModalOptions<TFormValues, TItem>,
) => {
  const {
    schema,
    defaultValues,
    onSubmit,
    onSuccess,
    item,
    show,
    resetOnClose = true,
    mapItemToValues,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formMethods = useForm<TFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const { reset, handleSubmit } = formMethods;

  // Use refs for values that might be unstable (inline objects/functions)
  // to prevent unnecessary effect re-runs while still accessing the latest values
  const defaultValuesRef = useRef(defaultValues);
  const mapItemToValuesRef = useRef(mapItemToValues);
  const onSubmitRef = useRef(onSubmit);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    defaultValuesRef.current = defaultValues;
    mapItemToValuesRef.current = mapItemToValues;
    onSubmitRef.current = onSubmit;
    onSuccessRef.current = onSuccess;
  }, [defaultValues, mapItemToValues, onSubmit, onSuccess]);

  useEffect(() => {
    if (show) {
      if (item) {
        const values = mapItemToValuesRef.current
          ? mapItemToValuesRef.current(item)
          : (item as unknown as TFormValues);
        reset(values);
      } else {
        reset(defaultValuesRef.current);
      }
      setSubmitError(null);
    } else if (resetOnClose) {
      reset(defaultValuesRef.current);
    }
  }, [show, item, resetOnClose, reset]);

  const handleFormSubmit = useCallback(async (data: TFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitRef.current(data);
      if (onSuccessRef.current) onSuccessRef.current();
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "An error occurred during submission."));
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    ...formMethods,
    isSubmitting,
    submitError,
    handleFormSubmit: handleSubmit(handleFormSubmit as any),
    setSubmitError,
  };
};
