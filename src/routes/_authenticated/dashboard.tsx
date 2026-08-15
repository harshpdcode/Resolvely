import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getMyComplaints } from "@/lib/complaints.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Zap,
  HelpCircle,
  ChevronDown,
  Shield,
  LifeBuoy,
  FileCheck,
  Headphones,
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

const QUICK_TEMPLATES = [
  {
    title: "Duplicate Monthly Billing Charge",
    desc: "I noticed a duplicate subscription charge of $49.99 on my credit card statement for this billing period.",
    category: "billing",
    badge: "Billing Dispute",
    icon: "💳",
  },
  {
    title: "API Gateway 504 Timeout Error",
    desc: "Our production webhook endpoints are failing with 504 Gateway Timeout when processing batch records.",
    category: "technical",
    badge: "System Outage",
    icon: "⚙️",
  },
  {
    title: "Order Delivery Delayed Beyond Expected Date",
    desc: "Package tracking #89204 has been stuck in transit for over 5 business days with no tracking updates.",
    category: "delivery",
    badge: "Delivery Delay",
    icon: "📦",
  },
  {
    title: "Unable to Enable 2FA Security Login",
    desc: "Authentication QR code gives an invalid token error when attempting to configure Google Authenticator.",
    category: "account",
    badge: "Security & Login",
    icon: "🔒",
  },
];

const FAQS = [
  {
    q: "How does the AI Triage work?",
    a: "Google Gemini 2.5 Flash analyzes your complaint title and description in real time. It identifies the topic, severity, financial impact, and urgency to assign the proper category and SLA priority automatically.",
  },
  {
    q: "What is the standard response time SLA?",
    a: "Our automated system routes urgent tickets within seconds. Support administrators investigate and respond with an average resolution turnaround of under 4.8 hours.",
  },
  {
    q: "How will I be notified when my ticket is updated?",
    a: "You receive in-app notification bell alerts immediately when a status changes, plus an email notification with full resolution notes when your ticket is marked resolved.",
  },
  {
    q: "Can I post follow-up updates to my ticket?",
    a: "Yes! Open any active complaint from your list below and use the discussion message box to send direct messages to the support team.",
  },
];

function DashboardPage() {
  const navigate = useNavigate();
  const fetchComplaints = useServerFn(getMyComplaints);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
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
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        (c.aiReason && c.aiReason.toLowerCase().includes(query));

      const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;
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

  function handleTemplateClick(t: (typeof QUICK_TEMPLATES)[number]) {
    navigate({
      to: "/new",
      search: {} as any,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in-up pb-16">
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
            label: "My Total Tickets",
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
              placeholder="Search your tickets by title, description or keyword…"
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
      <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90 backdrop-blur-md">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Your Complaints Feed</CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredData.length} of {data?.length ?? 0} tickets submitted by you
              </CardDescription>
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
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg">
                {hasActiveFilters ? "No matching complaints" : "No complaints submitted yet"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                {hasActiveFilters
                  ? "Try adjusting your search terms or filter selections."
                  : "You haven't logged any support tickets yet. Click any quick template below or submit a custom complaint."}
              </p>

              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-5 text-xs font-semibold">
                  <RotateCcw className="mr-1.5 h-3 w-3" /> Clear Filters
                </Button>
              ) : (
                <Link to="/new" className="mt-5">
                  <Button className="font-bold shadow-sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Submit Your First Ticket
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
                          <Sparkles className="h-2.5 w-2.5" /> AI Triaged
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
                          • <span className="text-primary font-semibold">AI Assessment:</span> {c.aiReason}
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

      {/* ⚡ Quick-Start Complaint Presets (Never leaves UI empty) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Instant Issue Templates
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose a common scenario to test real-time Google Gemini AI triage with 1 click.
            </p>
          </div>
          <Link to="/new" className="text-xs font-semibold text-primary hover:underline">
            Custom Intake →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_TEMPLATES.map((t) => (
            <Link
              key={t.title}
              to="/new"
              className="group rounded-2xl border border-border/70 bg-card/80 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md cursor-pointer block"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{t.icon}</span>
                <Badge variant="outline" className="text-[10px] uppercase font-bold bg-primary/10 text-primary border-primary/20">
                  {t.badge}
                </Badge>
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                {t.title}
              </h4>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                {t.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 4-Step Support Lifecycle Stepper */}
      <Card className="border-border/70 shadow-sm bg-card/90 overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" /> How Resolvely Resolves Your Complaints
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Smart Intake", desc: "Submit your issue title and description." },
              { step: "02", title: "AI Triage", desc: "Gemini AI categorizes urgency and priority." },
              { step: "03", title: "Support Action", desc: "Admin reviews audit log and applies fix." },
              { step: "04", title: "Resolution & CSAT", desc: "You receive email alert and rate support." },
            ].map((st) => (
              <div key={st.step} className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  STEP {st.step}
                </span>
                <h5 className="font-bold text-xs text-foreground mt-1.5">{st.title}</h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive FAQ / Knowledge Base Accordion */}
      <Card className="border-border/70 shadow-sm bg-card/90">
        <CardHeader className="border-b border-border/50 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" /> Help Center & Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 divide-y divide-border/60">
          {FAQS.map((faq, idx) => (
            <div key={faq.q} className="py-3 first:pt-0 last:pb-0">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed animate-fade-in-up">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
