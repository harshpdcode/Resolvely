import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL,
  formatDate, priorityBadgeClass, statusBadgeClass,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/complaints/$id")({
  component: ComplaintDetail,
});

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return Boolean(data);
    },
  });

  const { data: complaint, isLoading } = useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: updates } = useQuery({
    queryKey: ["complaint-updates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaint_updates")
        .select("id,from_status,to_status,note,created_at")
        .eq("complaint_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function changeStatus(status: string) {
    const { error } = await supabase.from("complaints").update({ status: status as (typeof STATUSES)[number] }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Status set to ${STATUS_LABEL[status]}`);
    queryClient.invalidateQueries({ queryKey: ["complaint", id] });
    queryClient.invalidateQueries({ queryKey: ["complaint-updates", id] });
    queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
    queryClient.invalidateQueries({ queryKey: ["all-complaints"] });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!complaint) return <p className="text-sm text-muted-foreground">Complaint not found.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{complaint.title}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Submitted {formatDate(complaint.created_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{CATEGORY_LABEL[complaint.category]}</Badge>
              <Badge variant="outline" className={priorityBadgeClass(complaint.priority)}>{PRIORITY_LABEL[complaint.priority]}</Badge>
              <Badge variant="outline" className={statusBadgeClass(complaint.status)}>{STATUS_LABEL[complaint.status]}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Description</div>
            <p className="whitespace-pre-wrap text-sm">{complaint.description}</p>
          </div>
          {complaint.ai_reason && (
            <div className="rounded-lg border bg-accent/30 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> AI triage
              </div>
              <p className="text-sm">{complaint.ai_reason}</p>
            </div>
          )}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <span className="text-sm font-medium">Change status:</span>
              <Select value={complaint.status} onValueChange={changeStatus}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
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
                      {u.from_status && (<span className="text-muted-foreground">from <b>{STATUS_LABEL[u.from_status]}</b></span>)}{" "}
                      to <b>{u.to_status ? STATUS_LABEL[u.to_status] : "—"}</b>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(u.created_at)}</div>
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
