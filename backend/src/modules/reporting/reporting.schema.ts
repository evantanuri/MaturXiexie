import { z } from "zod";

export const REPORT_CATEGORIES = [
  "broken_surface",
  "blocked_path",
  "no_ramp",
  "no_tactile_paving",
  "poor_lighting",
  "flooding",
  "good_condition",
] as const;

export const REPORT_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "resolved",
  "expired",
] as const;

export const VALIDATION_ACTIONS = ["confirm", "reject", "resolve"] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ValidationAction = (typeof VALIDATION_ACTIONS)[number];

export const createReportSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.enum(REPORT_CATEGORIES),
  severity: z.number().int().min(1).max(5),
  is_disability_barrier: z.boolean(),
  description: z.string().trim().max(500).optional(),
});

export const listReportsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(50).max(5000).default(500),
  status: z.enum(REPORT_STATUSES).optional(),
});

export const validateReportSchema = z.object({
  action: z.enum(VALIDATION_ACTIONS),
});
