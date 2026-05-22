import { z } from "zod";

/**
 * Zod schema for stage override payload .
 * Matches backend StageOverrideCreate.
 */
export const stageOverrideCreateSchema = z.object({
  override_reason: z.string().trim().min(1, "Override reason is required"),
  override_recommendation: z.enum(["approve", "reject", "May Be"]).nullable().optional(),
  // criterion_scores: z.record(z.number()).nullable().optional(),
});

/**
 * Zod schema for stage decision payload .
 * Matches backend StageDecisionCreate.
 */
export const stageDecisionCreateSchema = z.object({
  decision: z.enum(["approve", "reject", "May Be"]),
  notes: z.string().trim().nullable().optional(),
});

export type StageOverrideCreate = z.infer<typeof stageOverrideCreateSchema>;
export type StageDecisionCreate = z.infer<typeof stageDecisionCreateSchema>;
