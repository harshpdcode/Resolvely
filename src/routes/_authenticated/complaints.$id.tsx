import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  Sparkles,
  Clock,
  ShieldCheck,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Copy,
  Check,
  Tag,
  Flame,
} from "lucide-react";
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
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (complaint?.status) {
      setSelectedStatus(complaint.status);
    }
  }, [complaint?.status]);

  async function handleSaveStatus(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const targetStatus = (selectedStatus || complaint?.status || "open") as (typeof STATUSES)[number];
    
    setUpdating(true);
    try {
      await doUpdateStatus({
        data: {
          complaintId: id,
          status: targetStatus,
          note: statusNote.trim() || undefined,
        },
      });
      toast.success(`Status updated to ${STATUS_LABEL[targetStatus] ?? targetStatus} with audit note saved!`);
      setStatusNote("");
      queryClient.invalidateQueries({ queryKey: ["complaint", id] });
      queryClient.invalidateQueries({ queryKey: ["complaint-updates", id] });
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["all-complaints"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update complaint status");
    } finally {
      setUpdating(false);
    }
  }

  function copyTicketId() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success("Ticket ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
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
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up pb-16">
      {/* Back button & Action Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <button
          onClick={copyTicketId}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono bg-muted/60 hover:bg-muted px-2.5 py-1 rounded-lg border border-border/50 transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          <span>ID: {complaint.id}</span>
        </button>
      </div>

      {/* Main Ticket Information Card */}
      <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90 backdrop-blur-md">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {complaint.title}
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Submitted {formatDate(complaint.createdAt)}
                </span>
                {complaint.aiClassified && (
                  <span className="inline-flex items-center gap-1 text-primary font-semibold">
                    <Sparkles className="h-3 w-3" /> Auto-Triaged by Gemini AI
                  </span>
                )}
              </div>
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
                <Sparkles className="h-3.5 w-3.5" /> AI Triage Assessment (Google Gemini)
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                {complaint.aiReason}
              </p>
            </div>
          )}

          {/* Admin Status Management Action Area */}
          {isAdmin ? (
            <div className="rounded-2xl border border-border/80 bg-accent/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Admin Actions: Update Status & Log Audit Note
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold bg-primary/10 text-primary border-primary/30">
                  Admin Control
                </Badge>
              </div>

              <form onSubmit={handleSaveStatus} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Select Status */}
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label htmlFor="status-select" className="text-xs font-bold">
                      Set New Status
                    </Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(v) => setSelectedStatus(v)}
                      disabled={updating}
                    >
                      <SelectTrigger id="status-select" className="bg-background font-semibold text-xs h-10">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs font-semibold">
                            {STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Optional Resolution Note */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="status-note" className="text-xs font-bold">
                      Resolution / Audit Note (Saved to Database)
                    </Label>
                    <Textarea
                      id="status-note"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      rows={2}
                      placeholder="e.g., Refund processed via Stripe gateway. Ticket marked resolved."
                      className="bg-background text-xs resize-none"
                      disabled={updating}
                    />
                  </div>
                </div>

                {/* Dedicated Save & Update Button */}
                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={updating || (selectedStatus === complaint.status && !statusNote.trim())}
                    className="font-bold shadow-sm hover:shadow-glow-sm transition-all h-10 px-6 text-xs"
                  >
                    {updating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Changes…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-3.5 w-3.5" /> Update Status & Save Note
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>
                Our support team is actively reviewing your ticket. Any status updates and notes from support staff will appear in the activity log below.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="border-border/70 shadow-sm bg-card/90">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Activity & Audit Log
            </CardTitle>
            <span className="text-xs text-muted-foreground font-medium">
              {updates?.length ?? 0} {updates?.length === 1 ? "event" : "events"} recorded
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!updates || updates.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No status changes recorded yet. When an admin updates this ticket, the audit history will appear here.
            </div>
          ) : (
            <ol className="relative border-l-2 border-border/80 ml-3 space-y-6 py-2">
              {updates.map((u) => (
                <li key={u.id} className="ml-6 space-y-1.5">
                  <div className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-sm" />
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
                    <div className="rounded-xl border border-primary/20 bg-muted/60 p-3 text-xs text-foreground mt-2 leading-relaxed">
                      <span className="font-semibold text-primary block mb-0.5">Internal Note / Action:</span>
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
