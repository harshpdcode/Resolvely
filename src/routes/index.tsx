import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Brain,
  Clock,
  LineChart,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Inbox,
  Flame,
  ChevronRight,
  Check,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const DEMO_PRESETS = [
  {
    title: "Double billed on my monthly subscription",
    desc: "I noticed a duplicate charge of $49.99 on my Visa statement for invoice #4092.",
    category: "billing",
    priority: "high",
    reason: "Direct financial impact dispute regarding duplicate subscription transaction.",
  },
  {
    title: "Checkout API throws 500 Internal Server Error",
    desc: "All incoming webhook calls to /api/checkout are failing with error 500 since 08:30 AM.",
    category: "technical",
    priority: "urgent",
    reason: "Critical service outage blocking customer checkout revenue and operations.",
  },
  {
    title: "Package delayed for 4 days past estimated arrival",
    desc: "Tracking order #88129 shows in transit with no carrier scan updates for 4 days.",
    category: "delivery",
    priority: "medium",
    reason: "Logistical shipment delay requiring carrier inquiry.",
  },
];

function Landing() {
  const [activePreset, setActivePreset] = useState(0);
  const demo = DEMO_PRESETS[activePreset];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-surface selection:bg-primary/20 selection:text-primary">
      {/* Background Ambient Glow Orbs */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[750px] -translate-x-1/2 rounded-full bg-gradient-hero opacity-25 blur-[120px] animate-pulse-glow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[600px] -right-40 -z-10 h-[400px] w-[500px] rounded-full bg-primary/20 blur-[100px] animate-float-delayed"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[1100px] -left-40 -z-10 h-[450px] w-[500px] rounded-full bg-info/15 blur-[110px] animate-float"
        aria-hidden="true"
      />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="group flex items-center gap-2.5 font-semibold text-lg tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-glow">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>Resolvely</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/auth" search={{ mode: "signin" }}>
              <Button variant="ghost" size="sm" className="font-medium">
                Sign in
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm" className="shadow-sm hover:shadow-glow-sm transition-all duration-200">
                Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-28 pt-12 md:pt-20">
        {/* Hero Section */}
        <section className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary backdrop-blur-sm shadow-sm transition-all hover:bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by Google Gemini AI
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-[1.1]">
            Turn customer complaints into{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">instant resolutions</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            Resolvely automatically analyzes, categorizes, and assigns SLA priorities to customer issues in seconds.
            Built with modern AI triage, full audit logs, and actionable executive analytics.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="h-12 px-7 text-base font-semibold shadow-glow-sm hover:shadow-glow hover:scale-[1.02] transition-all">
                Create free account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "signin" }}>
              <Button size="lg" variant="outline" className="h-12 px-7 text-base hover:bg-accent/40">
                Sign in to Dashboard
              </Button>
            </Link>
          </div>

          {/* Micro stats banner */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Zero manual sorting needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>48h SLA Breach Alerting</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Full Role-Based Security</span>
            </div>
          </div>
        </section>

        {/* Live Interactive AI Triage Simulator Preview */}
        <section className="mt-16 md:mt-24">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card/80 p-5 sm:p-8 shadow-elevated backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Brain className="h-4 w-4" /> Live AI Triage Demo
                </div>
                <h2 className="text-xl font-bold mt-1">See how Gemini classifies issues in real time</h2>
              </div>
              {/* Preset Selector */}
              <div className="flex flex-wrap gap-1.5">
                {DEMO_PRESETS.map((p, idx) => (
                  <button
                    key={p.category}
                    onClick={() => setActivePreset(idx)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      activePreset === idx
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Preset {idx + 1}: {p.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Ticket Card */}
            <div className="mt-6 grid gap-6 md:grid-cols-5">
              <div className="md:col-span-3 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Input Ticket</div>
                <div className="rounded-xl border border-border/60 bg-muted/40 p-4 space-y-2">
                  <div className="font-semibold text-base">{demo.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{demo.desc}</p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">AI Triage Output</div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Category</span>
                    <Badge variant="outline" className="capitalize bg-background font-semibold">
                      {demo.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Priority Level</span>
                    <Badge
                      variant="outline"
                      className={`capitalize font-semibold ${
                        demo.priority === "urgent"
                          ? "border-destructive/30 bg-destructive/15 text-destructive"
                          : demo.priority === "high"
                          ? "border-warning/40 bg-warning/20 text-warning-foreground"
                          : "border-info/30 bg-info/15 text-info"
                      }`}
                    >
                      {demo.priority}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Reasoning:
                    </span>
                    {demo.reason}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="mt-28">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Everything You Need</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Built for speed, accuracy, and operational clarity</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Brain,
                title: "Automated AI Triage",
                body: "Deep semantic analysis categorizes issues into billing, tech, or logistics with instant severity scoring.",
                badge: "Gemini 2.0",
              },
              {
                icon: Clock,
                title: "Live Status & SLA Tracking",
                body: "Monitor tickets from Open → In Progress → Resolved with automatic 48h SLA breach detection.",
                badge: "Real-time",
              },
              {
                icon: LineChart,
                title: "Executive Analytics",
                body: "Interactive charts for volume trends, priority distributions, and average turnaround times.",
                badge: "Recharts",
              },
              {
                icon: ShieldCheck,
                title: "Role-Based Access Control",
                body: "Granular permissions with custom JWT tokens and bcrypt password encryption. Admins have complete visibility.",
                badge: "JWT + RBAC",
              },
              {
                icon: Zap,
                title: "Instant Ticket Intake",
                body: "Frictionless ticket submission with auto-attaching user credentials and background processing.",
                badge: "Fast",
              },
              {
                icon: Layers,
                title: "Transparent Audit Trail",
                body: "Every single status transition is logged with author identity, timestamp, and resolution notes.",
                badge: "Audit Log",
              },
            ].map(({ icon: Icon, title, body, badge }) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-border/70 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elevated hover:border-primary/30"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/15">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium bg-muted/60">
                    {badge}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Steps */}
        <section className="mt-28 rounded-3xl border border-border/70 bg-card/60 p-8 sm:p-12 backdrop-blur-sm">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">How It Works</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight">Four simple steps to faster resolutions</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: "01", title: "Intake", desc: "User submits complaint with issue details." },
              { step: "02", title: "AI Triage", desc: "Gemini classifies category & priority instantly." },
              { step: "03", title: "Admin Action", desc: "Support team resolves tickets with notes." },
              { step: "04", title: "Analytics", desc: "SLA metrics & charts update in real-time." },
            ].map((s) => (
              <div key={s.step} className="relative rounded-xl border border-border/50 bg-background/80 p-5 space-y-2">
                <div className="text-2xl font-extrabold text-primary/40">{s.step}</div>
                <div className="font-bold text-base">{s.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="mt-28 text-center relative overflow-hidden rounded-3xl bg-gradient-hero p-10 sm:p-16 text-primary-foreground shadow-elevated">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Ready to streamline your support workflow?</h2>
            <p className="text-primary-foreground/80 text-base sm:text-lg">
              Get started in seconds. Create your account and take control of customer complaint operations.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" variant="secondary" className="h-12 px-8 font-bold shadow-lg hover:scale-105 transition-transform">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/50 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Resolvely © {new Date().getFullYear()}
          </div>
          <div>Built with TanStack Start, React 19, Tailwind CSS v4, Prisma & Google Gemini</div>
        </div>
      </footer>
    </div>
  );
}
