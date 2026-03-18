import * as z from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address").trim(),
  password: z.string().trim().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
  email: z.email("Invalid email address").trim(),
  password: z.string().trim().min(6, "Password must be at least 6 characters"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
