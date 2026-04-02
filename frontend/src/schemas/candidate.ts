import * as z from "zod";

/**
 * Zod validation schema for candidate screening decisions.
 */

/**
 * Schema for submitting a screening decision (approve/reject/maybe) for a candidate.
 * Validates the decision type and ensures a reason is provided.
 */
export const candidateDecisionSchema = z.object({
  /** The screening decision */
  decision: z.enum(["approve", "reject", "maybe"]),
  /** The reason/note for the decision (minimum 10 characters for better justification) */
  note: z
    .string()
    .min(10, "Reason must be at least 10 characters long")
    .max(1000, "Reason must not exceed 1000 characters"),
});

/**
 * Type inferred from candidateDecisionSchema.
 */
export type CandidateDecisionFormValues = z.infer<typeof candidateDecisionSchema>;
