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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Sparkles, Clock, ShieldCheck, User, MessageSquare, CheckCircle2, AlertCircle, Send } from "lucide-react";
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
  const [updating, setUpdating] = useState(false);

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
    setUpdating(true);
    try {
      await doUpdateStatus({
        data: {
          complaintId: id,
          status: status as (typeof STATUSES)[number],
          note: statusNote.trim() || undefined,
        },
      });
      toast.success(`Status updated to ${STATUS_LABEL[status]}`);
      setStatusNote("");
      queryClient.invalidateQueries({ queryKey: ["complaint", id] });
      queryClient.invalidateQueries({ queryKey: ["complaint-updates", id] });
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["all-complaints"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="mx-auto max-w-xl text-center py-16">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h2 className="text-xl font-bold">Complaint Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This ticket may have been removed or you do not have permission to view it.
        </p>
        <Link to="/dashboard" className="mt-5 inline-block">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      {/* Back button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      {/* Main Ticket Information */}
      <Card className="border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {complaint.title}
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Submitted on {formatDate(complaint.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold capitalize bg-background">
                {CATEGORY_LABEL[complaint.category] ?? complaint.category}
              </Badge>
              <Badge variant="outline" className={`text-xs font-semibold capitalize ${priorityBadgeClass(complaint.priority)}`}>
                {PRIORITY_LABEL[complaint.priority] ?? complaint.priority}
              </Badge>
              <Badge variant="outline" className={`text-xs font-semibold capitalize ${statusBadgeClass(complaint.status)}`}>
                {STATUS_LABEL[complaint.status] ?? complaint.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Issue Description */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Complaint Description
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </div>
          </div>

          {/* AI Reason Card */}
          {complaint.aiReason && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI Triage Assessment
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {complaint.aiReason}
              </p>
            </div>
          )}

          {/* Admin Status Management Action Area */}
          {isAdmin && (
            <div className="rounded-xl border border-border/80 bg-accent/20 p-5 space-y-4">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" /> Admin Actions: Update Status
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label className="text-xs font-semibold">Change Status</Label>
                  <Select value={complaint.status} onValueChange={changeStatus} disabled={updating}>
                    <SelectTrigger className="bg-background">
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

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="status-note" className="text-xs font-semibold">
                    Optional Resolution / Audit Note
                  </Label>
                  <Textarea
                    id="status-note"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={2}
                    placeholder="Enter an optional note explaining the status change…"
                    className="bg-background text-xs resize-none"
                    disabled={updating}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Activity & Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {!updates || updates.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No status changes recorded yet.
            </div>
          ) : (
            <ol className="relative border-l border-border/80 ml-3 space-y-6 py-2">
              {updates.map((u) => (
                <li key={u.id} className="ml-6 space-y-1">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold">
                    <span>Status changed</span>
                    {u.fromStatus && (
                      <span className="text-muted-foreground font-normal">
                        from <b className="text-foreground">{STATUS_LABEL[u.fromStatus] ?? u.fromStatus}</b>
                      </span>
                    )}
                    <span>
                      to <b className="text-primary">{u.toStatus ? (STATUS_LABEL[u.toStatus] ?? u.toStatus) : "—"}</b>
                    </span>
                  </div>
                  {u.note && (
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-2.5 text-xs text-foreground mt-1.5">
                      "{u.note}"
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground pt-0.5">
                    {formatDate(u.createdAt)}
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
