import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyComplaints } from "@/lib/complaints.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Inbox } from "lucide-react";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  formatDate,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const fetchComplaints = useServerFn(getMyComplaints);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: () => fetchComplaints({}),
    staleTime: 30_000,
  });

  const counts = {
    total: data?.length ?? 0,
    open: data?.filter((d) => d.status === "open").length ?? 0,
    inProgress: data?.filter((d) => d.status === "in_progress").length ?? 0,
    resolved: data?.filter((d) => d.status === "resolved").length ?? 0,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My complaints</h1>
          <p className="text-sm text-muted-foreground">
            Track the status of tickets you've submitted.
          </p>
        </div>
        <Link to="/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New complaint
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: counts.total },
          { label: "Open", value: counts.open },
          { label: "In progress", value: counts.inProgress },
          { label: "Resolved", value: counts.resolved },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent complaints</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">
              Failed to load complaints. Please refresh.
            </p>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No complaints yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit your first ticket to see it here.
              </p>
              <Link to="/new" className="mt-4">
                <Button>Submit a complaint</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {data.map((c) => (
                <Link
                  key={c.id}
                  to="/complaints/$id"
                  params={{ id: c.id }}
                  className="flex flex-col gap-2 py-4 transition hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.title}</div>
                    <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {c.description}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Submitted {formatDate(c.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{CATEGORY_LABEL[c.category]}</Badge>
                    <Badge variant="outline" className={priorityBadgeClass(c.priority)}>
                      {PRIORITY_LABEL[c.priority]}
                    </Badge>
                    <Badge variant="outline" className={statusBadgeClass(c.status)}>
                      {STATUS_LABEL[c.status]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
