/**
 * Utility functions for handling and formatting errors.
 */
import axios from "axios";
/**
 * Extracts a user-friendly error message from an axios error or any other error.
 * Handles the common backend structure of fastapi style { detail: string } or fallback to message.
 * @param err - The error object to extract message from
 * @param fallback - Default message if extraction fails
 * @returns A user-friendly error message string
 */
export const extractErrorMessage = (
	err: unknown,
	fallback: string = "An unexpected error occurred.",
): string => {
	if (axios.isAxiosError(err)) {
		const detail = err.response?.data?.detail;

		// Handle FastAPI validation errors (error is array of errors)
		if (Array.isArray(detail)) {
			return detail
				.map((e: any) => `${e.loc.join(".")}: ${e.msg}`)
				.join(", ");
		}

		// Handle standard detail string
		if (typeof detail === "string") {
			return detail;
		}

		// Handle GlobalErrorHandlerMiddleware nested error structure
		const nestedError = err.response?.data?.error;
		if (nestedError && typeof nestedError.message === "string") {
			return nestedError.message;
		}

		return err.response?.data?.message || err.message || fallback;
	}
	if (err instanceof Error) {
		return err.message;
	}
	return fallback;
};
