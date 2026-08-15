/**
 * Notification server functions.
 * Provides unread count and mark-as-read functionality.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/integrations/auth/middleware";
import { markNotificationReadSchema } from "@/lib/validation";

function isMockMode() {
  return !process.env.DATABASE_URL || !process.env.JWT_SECRET;
}

// ─── getNotifications ─────────────────────────────────────────────────────

export type NotificationRow = {
  id: string;
  message: string;
  complaintId: string | null;
  readAt: string | null;
  createdAt: string;
};

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<{ items: NotificationRow[]; unread: number }> => {
    if (isMockMode()) {
      return { items: [], unread: 0 };
    }

    const { prisma } = await import("@/integrations/db/client.server");

    const notifications = await prisma.notification.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const items: NotificationRow[] = notifications.map((n) => ({
      id: n.id,
      message: n.message,
      complaintId: n.complaintId,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }));

    const unread = items.filter((n) => !n.readAt).length;

    return { items, unread };
  });

// ─── markNotificationRead ─────────────────────────────────────────────────

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => markNotificationReadSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    if (isMockMode()) return { ok: true };

    const { prisma } = await import("@/integrations/db/client.server");

    // Verify ownership before marking
    const notification = await prisma.notification.findUnique({
      where: { id: data.notificationId },
    });

    if (!notification || notification.userId !== context.userId) {
      throw new Error("Notification not found");
    }

    await prisma.notification.update({
      where: { id: data.notificationId },
      data: { readAt: new Date() },
    });

    return { ok: true };
  });

// ─── markAllNotificationsRead ─────────────────────────────────────────────

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<{ ok: boolean }> => {
    if (isMockMode()) return { ok: true };

    const { prisma } = await import("@/integrations/db/client.server");

    await prisma.notification.updateMany({
      where: { userId: context.userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { ok: true };
  });
