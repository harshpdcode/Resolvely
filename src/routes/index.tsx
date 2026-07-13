import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brain, Clock, LineChart, ShieldCheck, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          Resolvely
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth" search={{ mode: "signup" }}><Button>Get started</Button></Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
            <Sparkles className="h-3 w-3 text-primary" /> AI-powered ticket triage
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Turn complaints into <span className="bg-gradient-hero bg-clip-text text-transparent">resolutions</span>, faster.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Resolvely automatically categorizes and prioritizes every ticket, routes it through a
            structured workflow, and surfaces the analytics your team needs to improve.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}><Button size="lg">Create free account</Button></Link>
            <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
          </div>
        </section>

        <section className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: Brain, title: "AI classification", body: "Every complaint is categorized and prioritized on submission using Lovable AI." },
            { icon: Clock, title: "Status tracking", body: "Users and admins see live status, history, and resolution timelines." },
            { icon: LineChart, title: "Admin analytics", body: "Volume, category mix, priority spread, and average resolution time at a glance." },
            { icon: ShieldCheck, title: "Secure by default", body: "Row-level security ensures users only see their own tickets." },
            { icon: Zap, title: "Fast intake", body: "Submit in seconds. AI triage runs in the background." },
            { icon: Sparkles, title: "Clean workflow", body: "Open → In Progress → Resolved, with an audit trail of every change." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-elevated">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
