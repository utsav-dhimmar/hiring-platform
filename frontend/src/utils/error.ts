import axios from "axios";

/**
 * Extracts a user-friendly error message from an axios error or any other error.
 * Handles the common backend structure of { detail: string } or fallback to message.
 */
export const extractErrorMessage = (
  err: unknown,
  fallback: string = "An unexpected error occurred.",
): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.detail || err.response?.data?.message || err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
};
