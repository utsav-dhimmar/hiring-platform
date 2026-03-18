/**
 * Zod validation schemas for authentication forms.
 * Used with react-hook-form for form validation.
 */

import * as z from "zod";

/**
 * Schema for login form validation.
 * Validates email format and minimum password length.
 */
export const loginSchema = z.object({
  /** Valid email address */
  email: z.email("Invalid email address").trim(),
  /** Password with minimum 6 characters */
  password: z.string().trim().min(6, "Password must be at least 6 characters"),
});

/** Type inferred from loginSchema */
export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Schema for user registration form validation.
 * Validates full name, email format, and password requirements.
 */
export const registerSchema = z.object({
  /** User's full name, required */
  full_name: z.string().trim().min(1, "Full name is required"),
  /** Valid email address */
  email: z.email("Invalid email address").trim(),
  /** Password with minimum 6 characters */
  password: z.string().trim().min(6, "Password must be at least 6 characters"),
});

/** Type inferred from registerSchema */
export type RegisterFormValues = z.infer<typeof registerSchema>;
