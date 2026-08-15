/**
 * NotificationBell — polls for unread notifications every 60s.
 * Shows a badge with the unread count; clicking opens a dropdown list.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { getNotifications, markAllNotificationsRead } from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const fetchNotifications = useServerFn(getNotifications);
  const doMarkAllRead = useServerFn(markAllNotificationsRead);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({}),
    refetchInterval: 60_000, // poll every 60s
    staleTime: 30_000,
  });

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  async function handleMarkAllRead() {
    await doMarkAllRead({});
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications (${unread} unread)`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex flex-col gap-0.5 border-b px-4 py-3 transition-colors last:border-0",
                  !n.readAt && "bg-primary/5"
                )}
              >
                {n.complaintId ? (
                  <Link
                    to="/complaints/$id"
                    params={{ id: n.complaintId }}
                    onClick={() => setOpen(false)}
                    className="text-sm leading-snug hover:text-primary"
                  >
                    {n.message}
                  </Link>
                ) : (
                  <p className="text-sm leading-snug">{n.message}</p>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDate(n.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
