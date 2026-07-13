import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ClassifyInput = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(4000),
});

const CATEGORIES = ["billing", "technical", "service", "product", "delivery", "account", "other"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type ClassificationResult = {
  category: (typeof CATEGORIES)[number];
  priority: (typeof PRIORITIES)[number];
  reason: string;
};

/**
 * Uses Lovable AI Gateway to classify a complaint into category + priority.
 * Returns safe fallbacks if the AI call fails so submission never blocks.
 */
export const classifyComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ClassifyInput.parse(data))
  .handler(async ({ data }): Promise<ClassificationResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { category: "other", priority: "medium", reason: "AI disabled: missing API key" };
    }

    const system = `You are an expert customer support triage assistant. Classify the complaint into exactly one category and one priority.
Categories: ${CATEGORIES.join(", ")}.
Priorities: ${PRIORITIES.join(", ")} (urgent = safety/financial loss/service outage; high = blocks user; medium = degraded experience; low = minor/cosmetic).
Return ONLY compact JSON: {"category":"...","priority":"...","reason":"one short sentence"}.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: `Title: ${data.title}\n\nDescription: ${data.description}` },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("AI classify failed", res.status, text);
        return { category: "other", priority: "medium", reason: `AI error ${res.status}` };
      }
      const body = await res.json();
      const content: string = body?.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      const category = CATEGORIES.includes(parsed.category) ? parsed.category : "other";
      const priority = PRIORITIES.includes(parsed.priority) ? parsed.priority : "medium";
      const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : "";
      return { category, priority, reason };
    } catch (e) {
      console.error("AI classify exception", e);
      return { category: "other", priority: "medium", reason: "AI unavailable" };
    }
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: complaints, error } = await supabase
      .from("complaints")
      .select("status,priority,category,created_at,resolved_at");
    if (error) throw error;

    const total = complaints.length;
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let resolvedMs = 0;
    let resolvedCount = 0;
    const dayBuckets: Record<string, number> = {};

    for (const c of complaints) {
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
      byPriority[c.priority] = (byPriority[c.priority] ?? 0) + 1;
      byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
      if (c.resolved_at && c.created_at) {
        resolvedMs += new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime();
        resolvedCount++;
      }
      const day = new Date(c.created_at).toISOString().slice(0, 10);
      dayBuckets[day] = (dayBuckets[day] ?? 0) + 1;
    }

    const trend = Object.entries(dayBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));

    return {
      total,
      open: byStatus["open"] ?? 0,
      inProgress: byStatus["in_progress"] ?? 0,
      resolved: byStatus["resolved"] ?? 0,
      closed: byStatus["closed"] ?? 0,
      avgResolutionHours: resolvedCount ? Math.round((resolvedMs / resolvedCount) / 36e5 * 10) / 10 : 0,
      byPriority,
      byCategory,
      byStatus,
      trend,
    };
  });
