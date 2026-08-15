/**
 * Centralized Zod validation schemas for the entire app.
 * Used on both client-side forms and server-side function validators.
 */
import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// ─── Complaints ───────────────────────────────────────────────────────────

export const complaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Please describe the issue in at least 10 characters")
    .max(4000, "Description is too long (max 4000 characters)"),
});

export const VALID_CATEGORIES = [
  "billing",
  "technical",
  "service",
  "product",
  "delivery",
  "account",
  "other",
] as const;

export const VALID_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const VALID_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export const statusUpdateSchema = z.object({
  complaintId: z.string().min(1, "Invalid complaint ID"),
  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({ message: "Invalid status value" }),
  }),
  note: z.string().trim().max(1000, "Note too long").optional(),
});

export const submitComplaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200),
  description: z
    .string()
    .trim()
    .min(10, "Please describe the issue in at least 10 characters")
    .max(4000),
  category: z.enum(VALID_CATEGORIES).default("other"),
  priority: z.enum(VALID_PRIORITIES).default("medium"),
  aiReason: z.string().max(500).optional(),
  aiClassified: z.boolean().default(false),
});

// ─── Notifications ────────────────────────────────────────────────────────

export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1, "Invalid notification ID"),
});

// ─── Types ────────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ComplaintInput = z.infer<typeof complaintSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type SubmitComplaintInput = z.infer<typeof submitComplaintSchema>;
