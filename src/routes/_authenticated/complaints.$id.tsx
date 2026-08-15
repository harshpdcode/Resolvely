import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getComplaintById,
  getComplaintUpdates,
  updateComplaintStatus,
} from "@/lib/complaints.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast as sonnerToast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  formatDate,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/complaints/$id")({
  component: ComplaintDetail,
});

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const isAdmin = user.role === "admin";
  const [statusNote, setStatusNote] = useState("");

  const fetchComplaint = useServerFn(getComplaintById);
  const fetchUpdates = useServerFn(getComplaintUpdates);
  const doUpdateStatus = useServerFn(updateComplaintStatus);

  const { data: complaint, isLoading } = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => fetchComplaint({ data: { id } }),
  });

  const { data: updates } = useQuery({
    queryKey: ["complaint-updates", id],
    queryFn: () => fetchUpdates({ data: { complaintId: id } }),
    enabled: !!complaint,
  });

  async function changeStatus(status: string) {
    try {
      await doUpdateStatus({
        data: {
          complaintId: id,
          status: status as (typeof STATUSES)[number],
          note: statusNote.trim() || undefined,
        },
      });
      sonnerToast.success(`Status set to ${STATUS_LABEL[status]}`);
      setStatusNote("");
      queryClient.invalidateQueries({ queryKey: ["complaint", id] });
      queryClient.invalidateQueries({ queryKey: ["complaint-updates", id] });
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["all-complaints"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!complaint) return <p className="text-sm text-muted-foreground">Complaint not found.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{complaint.title}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted {formatDate(complaint.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{CATEGORY_LABEL[complaint.category]}</Badge>
              <Badge variant="outline" className={priorityBadgeClass(complaint.priority)}>
                {PRIORITY_LABEL[complaint.priority]}
              </Badge>
              <Badge variant="outline" className={statusBadgeClass(complaint.status)}>
                {STATUS_LABEL[complaint.status]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Description
            </div>
            <p className="whitespace-pre-wrap text-sm">{complaint.description}</p>
          </div>
          {complaint.aiReason && (
            <div className="rounded-lg border bg-accent/30 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> AI triage
              </div>
              <p className="text-sm">{complaint.aiReason}</p>
            </div>
          )}
          {isAdmin && (
            <div className="space-y-3 rounded-lg border p-3">
              <span className="text-sm font-medium">Change status:</span>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={complaint.status} onValueChange={changeStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status-note" className="text-xs text-muted-foreground">
                  Optional note
                </Label>
                <Textarea
                  id="status-note"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                  placeholder="Add a note for this status change…"
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!updates || updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status changes yet.</p>
          ) : (
            <ol className="space-y-3">
              {updates.map((u) => (
                <li key={u.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm">
                      Status changed{" "}
                      {u.fromStatus && (
                        <span className="text-muted-foreground">
                          from <b>{STATUS_LABEL[u.fromStatus]}</b>
                        </span>
                      )}{" "}
                      to <b>{u.toStatus ? STATUS_LABEL[u.toStatus] : "—"}</b>
                    </div>
                    {u.note && <p className="mt-0.5 text-sm text-muted-foreground">{u.note}</p>}
                    <div className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
