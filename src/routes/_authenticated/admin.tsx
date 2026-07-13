import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAdminStats } from "@/lib/complaints.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import {
  CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL,
  formatDate, priorityBadgeClass, statusBadgeClass,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

const COLORS = ["oklch(0.55 0.2 260)", "oklch(0.62 0.15 155)", "oklch(0.75 0.16 75)", "oklch(0.6 0.22 25)", "oklch(0.62 0.14 230)", "oklch(0.7 0.1 300)", "oklch(0.5 0.1 200)"];

function AdminPage() {
  const stats = useServerFn(getAdminStats);
  const { data: analytics } = useQuery({ queryKey: ["admin-stats"], queryFn: () => stats() });

  const { data: all } = useQuery({
    queryKey: ["all-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id,title,category,priority,status,created_at,user_id")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const categoryData = analytics ? Object.entries(analytics.byCategory).map(([k, v]) => ({ name: CATEGORY_LABEL[k] ?? k, value: v })) : [];
  const priorityData = analytics ? Object.entries(analytics.byPriority).map(([k, v]) => ({ name: PRIORITY_LABEL[k] ?? k, value: v })) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of all complaints across the system.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total", value: analytics?.total ?? 0 },
          { label: "Open", value: analytics?.open ?? 0 },
          { label: "In progress", value: analytics?.inProgress ?? 0 },
          { label: "Resolved", value: analytics?.resolved ?? 0 },
          { label: "Avg resolution", value: analytics?.avgResolutionHours ? `${analytics.avgResolutionHours}h` : "—" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-semibold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Volume (last 14 days)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0.01 260)" }} />
                <Line type="monotone" dataKey="count" stroke="oklch(0.55 0.2 260)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Priority mix</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={2}>
                  {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Category breakdown</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0.01 260)" }} />
                <Bar dataKey="value" fill="oklch(0.55 0.2 260)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All complaints</CardTitle></CardHeader>
        <CardContent>
          {!all || all.length === 0 ? (
            <p className="text-sm text-muted-foreground">No complaints yet.</p>
          ) : (
            <div className="divide-y">
              {all.map((c) => (
                <Link key={c.id} to="/complaints/$id" params={{ id: c.id }} className="flex flex-col gap-2 py-3 transition hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(c.created_at)}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{CATEGORY_LABEL[c.category]}</Badge>
                    <Badge variant="outline" className={priorityBadgeClass(c.priority)}>{PRIORITY_LABEL[c.priority]}</Badge>
                    <Badge variant="outline" className={statusBadgeClass(c.status)}>{STATUS_LABEL[c.status]}</Badge>
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
