import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats, getMyComplaints } from "@/lib/complaints.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  formatDate,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/format";
import {
  ShieldAlert,
  TrendingUp,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    // Admin guard
    if (context.user.role !== "admin") throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

const COLORS = [
  "oklch(0.55 0.22 265)",
  "oklch(0.62 0.17 150)",
  "oklch(0.74 0.18 70)",
  "oklch(0.58 0.24 25)",
  "oklch(0.6 0.16 235)",
  "oklch(0.7 0.12 300)",
  "oklch(0.5 0.12 200)",
];

function AdminPage() {
  const fetchStats = useServerFn(getAdminStats);
  const fetchComplaints = useServerFn(getMyComplaints);

  const { data: analytics, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats({}),
  });

  const { data: all, isLoading: complaintsLoading } = useQuery({
    queryKey: ["all-complaints"],
    queryFn: () => fetchComplaints({}),
  });

  const categoryData = analytics
    ? Object.entries(analytics.byCategory).map(([k, v]) => ({
        name: CATEGORY_LABEL[k] ?? k,
        count: v,
      }))
    : [];

  const priorityData = analytics
    ? Object.entries(analytics.byPriority).map(([k, v]) => ({
        name: PRIORITY_LABEL[k] ?? k,
        value: v,
      }))
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <ShieldAlert className="h-4 w-4" /> System Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Admin Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time intelligence on customer issues, team resolution speed, and SLA compliance.
          </p>
        </div>
      </div>

      {/* SLA Breach Alert Banner */}
      {analytics && analytics.slaBreaches > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:p-5 text-destructive shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base">
                {analytics.slaBreaches} {analytics.slaBreaches === 1 ? "Ticket Requires" : "Tickets Require"} Immediate Attention
              </div>
              <p className="text-xs text-destructive/90 mt-0.5">
                These high-priority tickets have exceeded the standard 48-hour SLA resolution window.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Intake", value: analytics?.total ?? 0, icon: Layers, color: "text-primary", bg: "bg-primary/10" },
          { label: "Open Tickets", value: analytics?.open ?? 0, icon: AlertTriangle, color: "text-info", bg: "bg-info/10" },
          { label: "In Progress", value: analytics?.inProgress ?? 0, icon: Clock, color: "text-warning-foreground dark:text-warning", bg: "bg-warning/15" },
          { label: "Resolved", value: analytics?.resolved ?? 0, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
          {
            label: "Avg Turnaround",
            value: analytics?.avgResolutionHours ? `${analytics.avgResolutionHours}h` : "—",
            icon: TrendingUp,
            color: "text-primary",
            bg: "bg-primary/10",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/70 card-hover-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 14-Day Trend Line Chart */}
        <Card className="lg:col-span-2 border-border/70 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <LineIcon className="h-4 w-4 text-primary" /> Complaint Volume (Last 14 Days)
              </CardTitle>
              <CardDescription className="text-xs">Daily ticket submission intake frequency</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-64 sm:h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.015 260 / 0.6)" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    borderRadius: "0.75rem",
                    border: "1px solid oklch(0.91 0.015 260)",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="oklch(0.52 0.24 265)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "oklch(0.52 0.24 265)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Mix Pie Chart */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" /> Priority Breakdown
            </CardTitle>
            <CardDescription className="text-xs">Severity distribution across all tickets</CardDescription>
          </CardHeader>
          <CardContent className="h-64 sm:h-72 flex items-center justify-center">
            {priorityData.length === 0 ? (
              <div className="text-xs text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {priorityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      borderRadius: "0.75rem",
                      border: "1px solid oklch(0.91 0.015 260)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown Bar Chart */}
        <Card className="lg:col-span-3 border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Category Distribution
            </CardTitle>
            <CardDescription className="text-xs">Issue breakdown by department & service area</CardDescription>
          </CardHeader>
          <CardContent className="h-64 sm:h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.015 260 / 0.6)" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    borderRadius: "0.75rem",
                    border: "1px solid oklch(0.91 0.015 260)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.52 0.24 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Master Complaints Table */}
      <Card className="border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">All System Complaints</CardTitle>
              <CardDescription className="text-xs">Master list of customer tickets across all departments</CardDescription>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {all?.length ?? 0} total
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!all || all.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No complaints in system.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {all.map((c) => (
                <Link
                  key={c.id}
                  to="/complaints/$id"
                  params={{ id: c.id }}
                  className="group flex flex-col gap-2 p-4 sm:p-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {c.title}
                      </span>
                      {c.aiClassified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Sparkles className="h-2.5 w-2.5" /> AI
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Submitted on {formatDate(c.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs font-semibold capitalize bg-background">
                      {CATEGORY_LABEL[c.category] ?? c.category}
                    </Badge>
                    <Badge variant="outline" className={`text-xs font-semibold capitalize ${priorityBadgeClass(c.priority)}`}>
                      {PRIORITY_LABEL[c.priority] ?? c.priority}
                    </Badge>
                    <Badge variant="outline" className={`text-xs font-semibold capitalize ${statusBadgeClass(c.status)}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-foreground hidden sm:block" />
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
