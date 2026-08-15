/**
 * Complaint server functions — replaces all direct Supabase client calls.
 * Authorization is enforced here (not at DB level, since MySQL has no RLS).
 *
 * AI triage uses Google Gemini directly (GOOGLE_GENERATIVE_AI_API_KEY).
 * Falls back gracefully if AI is unavailable so submission never breaks.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/integrations/auth/middleware";
import {
  complaintSchema,
  submitComplaintSchema,
  statusUpdateSchema,
  VALID_CATEGORIES,
  VALID_PRIORITIES,
} from "@/lib/validation";

// ─── Types ────────────────────────────────────────────────────────────────

export type ClassificationResult = {
  category: (typeof VALID_CATEGORIES)[number];
  priority: (typeof VALID_PRIORITIES)[number];
  reason: string;
};

export type ComplaintRow = {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  aiReason: string | null;
  aiClassified: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type ComplaintUpdateRow = {
  id: string;
  complaintId: string;
  authorId: string | null;
  note: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
};

// ─── AI Classification ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert customer support triage assistant. Classify the complaint into exactly one category and one priority.
Categories: billing, technical, service, product, delivery, account, other.
Priorities: low, medium, high, urgent (urgent = safety/financial loss/service outage; high = blocks user; medium = degraded experience; low = minor/cosmetic).
Return ONLY compact JSON: {"category":"...","priority":"...","reason":"one short sentence"}.`;

async function callGemini(title: string, description: string): Promise<ClassificationResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return { category: "other", priority: "medium", reason: "AI disabled: GOOGLE_GENERATIVE_AI_API_KEY not set" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${SYSTEM_PROMPT}\n\nTitle: ${title}\n\nDescription: ${description}` },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[AI] Gemini classify failed", res.status, text);
      return { category: "other", priority: "medium", reason: `AI error ${res.status}` };
    }

    const body = await res.json();
    const content: string = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    // Strip possible markdown code fences from the response
    const jsonStr = content.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "other";
    const priority = VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : "medium";
    const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : "";

    return { category, priority, reason };
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      console.error("[AI] Gemini timed out");
      return { category: "other", priority: "medium", reason: "AI triage timed out — classified as other/medium" };
    }
    console.error("[AI] Gemini exception", e);
    return { category: "other", priority: "medium", reason: "AI unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Mock helpers ─────────────────────────────────────────────────────────

function isMockMode() {
  return !process.env.DATABASE_URL || !process.env.JWT_SECRET;
}

function serializeComplaint(c: any): ComplaintRow {
  return {
    id: c.id,
    userId: c.userId,
    title: c.title,
    description: c.description,
    category: c.category,
    priority: c.priority,
    status: c.status,
    aiReason: c.aiReason ?? null,
    aiClassified: c.aiClassified,
    createdAt: (c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)).toISOString(),
    updatedAt: (c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt)).toISOString(),
    resolvedAt: c.resolvedAt ? (c.resolvedAt instanceof Date ? c.resolvedAt : new Date(c.resolvedAt)).toISOString() : null,
  };
}

function serializeUpdate(u: any): ComplaintUpdateRow {
  return {
    id: u.id,
    complaintId: u.complaintId,
    authorId: u.authorId ?? null,
    note: u.note ?? null,
    fromStatus: u.fromStatus ?? null,
    toStatus: u.toStatus ?? null,
    createdAt: (u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt)).toISOString(),
  };
}

// ─── classifyComplaint ────────────────────────────────────────────────────

export const classifyComplaint = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => complaintSchema.parse(data))
  .handler(async ({ data }): Promise<ClassificationResult> => {
    return callGemini(data.title, data.description);
  });

// ─── submitComplaint ──────────────────────────────────────────────────────

export const submitComplaint = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => submitComplaintSchema.parse(data))
  .handler(async ({ data, context }): Promise<ComplaintRow> => {
    if (isMockMode()) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      const result = await mockSupabase.from("complaints").insert({
        user_id: context.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "open",
        ai_reason: data.aiReason ?? null,
        ai_classified: data.aiClassified,
      });
      const mockRecord = (result as any).data ?? {};
      return {
        id: mockRecord.id ?? "mock-id",
        userId: context.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "open",
        aiReason: data.aiReason ?? null,
        aiClassified: data.aiClassified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolvedAt: null,
      };
    }

    const { prisma } = await import("@/integrations/db/client.server");

    const complaint = await prisma.complaint.create({
      data: {
        userId: context.userId, // Server-enforced — client cannot fake this
        title: data.title,
        description: data.description,
        category: data.category as any,
        priority: data.priority as any,
        status: "open",
        aiReason: data.aiReason ?? null,
        aiClassified: data.aiClassified,
      },
    });

    return serializeComplaint(complaint);
  });

// ─── getMyComplaints ──────────────────────────────────────────────────────

export const getMyComplaints = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<ComplaintRow[]> => {
    if (isMockMode()) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      // Admin sees all, user sees own
      const builder = mockSupabase.from("complaints").select("*").order("created_at", { ascending: false });
      if (context.role !== "admin") (builder as any).eq("user_id", context.userId);
      const { data } = await (builder as any);
      return (data ?? []).map((c: any) => ({
        id: c.id, userId: c.user_id, title: c.title, description: c.description,
        category: c.category, priority: c.priority, status: c.status,
        aiReason: c.ai_reason ?? null, aiClassified: c.ai_classified,
        createdAt: c.created_at, updatedAt: c.updated_at, resolvedAt: c.resolved_at ?? null,
      }));
    }

    const { prisma } = await import("@/integrations/db/client.server");

    const where = context.role === "admin" ? {} : { userId: context.userId };
    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return complaints.map(serializeComplaint);
  });

// ─── getComplaintById ─────────────────────────────────────────────────────

export const getComplaintById = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<ComplaintRow | null> => {
    if (isMockMode()) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      const { data: c } = await mockSupabase.from("complaints").select("*").eq("id", data.id).maybeSingle();
      if (!c) return null;
      if (context.role !== "admin" && c.user_id !== context.userId) return null;
      return {
        id: c.id, userId: c.user_id, title: c.title, description: c.description,
        category: c.category, priority: c.priority, status: c.status,
        aiReason: c.ai_reason ?? null, aiClassified: c.ai_classified,
        createdAt: c.created_at, updatedAt: c.updated_at, resolvedAt: c.resolved_at ?? null,
      };
    }

    const { prisma } = await import("@/integrations/db/client.server");
    const complaint = await prisma.complaint.findUnique({ where: { id: data.id } });
    if (!complaint) return null;

    // Authorization: user can only view own complaints; admin can view all
    if (context.role !== "admin" && complaint.userId !== context.userId) {
      return null; // Return null rather than throwing to avoid leaking existence
    }

    return serializeComplaint(complaint);
  });

// ─── getComplaintUpdates ──────────────────────────────────────────────────

export const getComplaintUpdates = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ complaintId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<ComplaintUpdateRow[]> => {
    if (isMockMode()) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      const { data: updates } = await mockSupabase.from("complaint_updates").select("*").eq("complaint_id", data.complaintId).order("created_at", { ascending: false });
      // Verify the complaint belongs to this user (or admin)
      const { data: c } = await mockSupabase.from("complaints").select("*").eq("id", data.complaintId).maybeSingle();
      if (!c || (context.role !== "admin" && c.user_id !== context.userId)) return [];
      return (updates ?? []).map((u: any) => ({
        id: u.id, complaintId: u.complaint_id, authorId: u.author_id ?? null,
        note: u.note ?? null, fromStatus: u.from_status ?? null, toStatus: u.to_status ?? null,
        createdAt: u.created_at,
      }));
    }

    const { prisma } = await import("@/integrations/db/client.server");

    // Verify access first
    const complaint = await prisma.complaint.findUnique({ where: { id: data.complaintId } });
    if (!complaint || (context.role !== "admin" && complaint.userId !== context.userId)) {
      return [];
    }

    const updates = await prisma.complaintUpdate.findMany({
      where: { complaintId: data.complaintId },
      orderBy: { createdAt: "desc" },
    });

    return updates.map(serializeUpdate);
  });

// ─── updateComplaintStatus ────────────────────────────────────────────────

export const updateComplaintStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => statusUpdateSchema.parse(data))
  .handler(async ({ data, context }): Promise<ComplaintRow> => {
    if (context.role !== "admin") {
      throw new Error("Forbidden: only admins can update complaint status");
    }

    if (isMockMode()) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      await mockSupabase.from("complaints").update({ status: data.status as any }).eq("id", data.complaintId);
      const { data: c } = await mockSupabase.from("complaints").select("*").eq("id", data.complaintId).maybeSingle();
      if (!c) throw new Error("Complaint not found");
      return {
        id: c.id, userId: c.user_id, title: c.title, description: c.description,
        category: c.category, priority: c.priority, status: c.status,
        aiReason: c.ai_reason ?? null, aiClassified: c.ai_classified,
        createdAt: c.created_at, updatedAt: c.updated_at, resolvedAt: c.resolved_at ?? null,
      };
    }

    const { prisma } = await import("@/integrations/db/client.server");

    const existing = await prisma.complaint.findUnique({ where: { id: data.complaintId } });
    if (!existing) throw new Error("Complaint not found");

    const now = new Date();
    const isBecomingResolved = data.status === "resolved" && existing.status !== "resolved";

    // Atomic: update complaint + log status change
    const [updated] = await prisma.$transaction([
      prisma.complaint.update({
        where: { id: data.complaintId },
        data: {
          status: data.status as any,
          updatedAt: now,
          resolvedAt: isBecomingResolved ? now : existing.resolvedAt,
        },
      }),
      prisma.complaintUpdate.create({
        data: {
          complaintId: data.complaintId,
          authorId: context.userId,
          fromStatus: existing.status as any,
          toStatus: data.status as any,
          note: data.note ?? null,
        },
      }),
    ]);

    // Send notification to the complaint owner (non-blocking)
    if (existing.userId !== context.userId) {
      notifyStatusChange({
        complaintId: data.complaintId,
        ownerId: existing.userId,
        newStatus: data.status,
        complaintTitle: existing.title,
      }).catch(console.error);
    }

    return serializeComplaint(updated);
  });

// ─── notifyStatusChange (internal helper) ────────────────────────────────

async function notifyStatusChange(opts: {
  complaintId: string;
  ownerId: string;
  newStatus: string;
  complaintTitle: string;
}) {
  const { prisma } = await import("@/integrations/db/client.server");

  const statusLabel: Record<string, string> = {
    open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
  };

  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId: opts.ownerId,
      complaintId: opts.complaintId,
      message: `Your ticket "${opts.complaintTitle}" was updated to ${statusLabel[opts.newStatus] ?? opts.newStatus}.`,
    },
  });

  // Send email if configured
  const owner = await prisma.user.findUnique({ where: { id: opts.ownerId } });
  if (owner) {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const { sendEmail, statusChangeEmailHtml } = await import("@/lib/email.server");
    await sendEmail({
      to: owner.email,
      subject: `Ticket update: ${opts.complaintTitle}`,
      html: statusChangeEmailHtml({
        complaintTitle: opts.complaintTitle,
        newStatus: opts.newStatus,
        complaintId: opts.complaintId,
        appUrl,
      }),
    });
  }
}

// ─── getAdminStats ────────────────────────────────────────────────────────

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (context.role !== "admin") throw new Error("Forbidden");

    if (isMockMode()) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      const { data: complaints } = await mockSupabase.from("complaints").select("*");
      return computeStats(complaints?.map((c: any) => ({
        status: c.status, priority: c.priority, category: c.category,
        createdAt: new Date(c.created_at), resolvedAt: c.resolved_at ? new Date(c.resolved_at) : null,
      })) ?? []);
    }

    const { prisma } = await import("@/integrations/db/client.server");
    const complaints = await prisma.complaint.findMany({
      select: { status: true, priority: true, category: true, createdAt: true, resolvedAt: true },
    });

    return computeStats(complaints.map((c) => ({
      status: c.status,
      priority: c.priority,
      category: c.category,
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
    })));
  });

function computeStats(complaints: Array<{
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
  resolvedAt: Date | null;
}>) {
  const total = complaints.length;
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let resolvedMs = 0;
  let resolvedCount = 0;
  const dayBuckets: Record<string, number> = {};
  const now = new Date();
  const slaThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48h

  let slaBreaches = 0;

  for (const c of complaints) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    byPriority[c.priority] = (byPriority[c.priority] ?? 0) + 1;
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;

    if (c.resolvedAt && c.createdAt) {
      resolvedMs += c.resolvedAt.getTime() - c.createdAt.getTime();
      resolvedCount++;
    }

    const day = c.createdAt.toISOString().slice(0, 10);
    dayBuckets[day] = (dayBuckets[day] ?? 0) + 1;

    if ((c.status === "open" || c.status === "in_progress") && c.createdAt < slaThreshold) {
      slaBreaches++;
    }
  }

  // Build full 14-day trend (filling in zeros for missing days)
  const trend: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    trend.push({ date: dateStr.slice(5), count: dayBuckets[dateStr] ?? 0 });
  }

  return {
    total,
    open: byStatus["open"] ?? 0,
    inProgress: byStatus["in_progress"] ?? 0,
    resolved: byStatus["resolved"] ?? 0,
    closed: byStatus["closed"] ?? 0,
    avgResolutionHours: resolvedCount
      ? Math.round((resolvedMs / resolvedCount / 36e5) * 10) / 10
      : 0,
    slaBreaches,
    byPriority,
    byCategory,
    byStatus,
    trend,
  };
}
