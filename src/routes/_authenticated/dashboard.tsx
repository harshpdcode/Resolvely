import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getMyComplaints } from "@/lib/complaints.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Layers,
  Search,
  Filter,
  X,
  RotateCcw,
} from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: () => fetchComplaints({}),
    staleTime: 30_000,
  });

  const counts = useMemo(() => {
    return {
      total: data?.length ?? 0,
      open: data?.filter((d) => d.status === "open").length ?? 0,
      inProgress: data?.filter((d) => d.status === "in_progress").length ?? 0,
      resolved: data?.filter((d) => d.status === "resolved").length ?? 0,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((c) => {
      // Search text match
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        (c.aiReason && c.aiReason.toLowerCase().includes(query));

      // Category filter
      const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;

      // Status filter
      const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;

      // Priority filter
      const matchesPriority = selectedPriority === "all" || c.priority === selectedPriority;

      return matchesQuery && matchesCategory && matchesStatus && matchesPriority;
    });
  }, [data, searchQuery, selectedCategory, selectedStatus, selectedPriority]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    selectedPriority !== "all";

  function resetFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedPriority("all");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 animate-fade-in-up pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Customer Intake & Support Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">My Complaints</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and monitor the status of your submitted tickets in real time.
          </p>
        </div>
        <Link to="/new">
          <Button className="font-bold shadow-sm hover:shadow-glow-sm transition-all h-10 px-5">
            <PlusCircle className="mr-2 h-4 w-4" /> Submit New Ticket
          </Button>
        </Link>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Tickets",
            value: counts.total,
            icon: Layers,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Open / Pending",
            value: counts.open,
            icon: AlertCircle,
            color: "text-info",
            bg: "bg-info/10",
          },
          {
            label: "In Progress",
            value: counts.inProgress,
            icon: Clock,
            color: "text-warning-foreground dark:text-warning",
            bg: "bg-warning/15",
          },
          {
            label: "Resolved",
            value: counts.resolved,
            icon: CheckCircle2,
            color: "text-success",
            bg: "bg-success/10",
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

      {/* Search & Filter Controls Toolbar */}
      <Card className="border-border/70 shadow-sm p-4 space-y-3 bg-card/90 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints by title, description or keyword…"
              className="pl-9 bg-background/50 text-sm focus:bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background/80 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="service">Service</option>
              <option value="product">Product</option>
              <option value="delivery">Delivery</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background/80 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background/80 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1.5 h-3 w-3" /> Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tickets Master List */}
      <Card className="border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Complaints Feed</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing {filteredData.length} of {data?.length ?? 0} tickets
              </p>
            </div>
            <Link to="/new">
              <Button size="sm" variant="outline" className="text-xs font-semibold h-8">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> New Ticket
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/60" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">
              Failed to load complaints. Please refresh the page.
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg">
                {hasActiveFilters ? "No matching complaints" : "No complaints found"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                {hasActiveFilters
                  ? "Try adjusting your search terms or filter selections."
                  : "You haven't submitted any complaints yet. Submit a new ticket to get fast AI assistance."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-5 text-xs font-semibold">
                  <RotateCcw className="mr-1.5 h-3 w-3" /> Clear Filters
                </Button>
              ) : (
                <Link to="/new" className="mt-5">
                  <Button className="font-bold shadow-sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Submit a Complaint
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredData.map((c) => (
                <Link
                  key={c.id}
                  to="/complaints/$id"
                  params={{ id: c.id }}
                  className="group flex flex-col gap-3 p-4 sm:p-5 transition-colors hover:bg-muted/35 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                        {c.title}
                      </span>
                      {c.aiClassified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Sparkles className="h-2.5 w-2.5" /> AI
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs sm:text-sm text-muted-foreground">
                      {c.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                      <span>Submitted on {formatDate(c.createdAt)}</span>
                      {c.aiReason && (
                        <span className="hidden md:inline-block text-foreground/80 font-medium">
                          • <span className="text-primary font-semibold">AI Triage:</span> {c.aiReason}
                        </span>
                      )}
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
