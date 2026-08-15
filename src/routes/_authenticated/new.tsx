import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { classifyComplaint, submitComplaint } from "@/lib/complaints.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowLeft, Loader2, Lightbulb, CheckCircle2, ShieldAlert } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(10, "Please describe the issue in at least 10 characters").max(4000),
});

export const Route = createFileRoute("/_authenticated/new")({
  component: NewComplaint,
});

function NewComplaint() {
  const navigate = useNavigate();
  const classify = useServerFn(classifyComplaint);
  const submit = useServerFn(submitComplaint);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [triageStep, setTriageStep] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ title, description });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    setTriageStep("AI is analyzing category & urgency…");
    try {
      // Step 1: AI classify
      const classification = await classify({ data: parsed.data });

      setTriageStep("Saving ticket to secure database…");

      // Step 2: Persist via server function
      const complaint = await submit({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          category: classification.category,
          priority: classification.priority,
          aiReason: classification.reason,
          aiClassified: true,
        },
      });

      toast.success(
        `Ticket submitted! Classified as ${classification.category.toUpperCase()} · ${classification.priority.toUpperCase()}`
      );
      navigate({ to: "/complaints/$id", params: { id: complaint.id } });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to submit complaint");
    } finally {
      setSubmitting(false);
      setTriageStep(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">
      {/* Back button & Heading */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Submit a Complaint</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Provide issue details below. Google Gemini AI will classify category and urgency automatically.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Sparkles className="h-4 w-4 text-primary" /> New Ticket Intake
              </CardTitle>
              <CardDescription className="text-xs">
                All tickets are logged with a tracking ID and monitored under SLA.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Ticket Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of the issue (e.g., Billing charge error)"
                    maxLength={200}
                    required
                    disabled={submitting}
                    className="focus:bg-background transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="desc" className="text-xs font-semibold">
                      Detailed Description
                    </Label>
                    <span
                      className={`text-[11px] font-medium ${
                        description.length > 3800
                          ? "text-destructive"
                          : description.length >= 10
                          ? "text-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      {description.length}/4000 chars
                    </span>
                  </div>
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={7}
                    placeholder="Please describe what happened, when it occurred, and any error messages you received…"
                    maxLength={4000}
                    required
                    disabled={submitting}
                    className="focus:bg-background transition-colors resize-y leading-relaxed text-sm"
                  />
                </div>

                {/* Submitting progress banner */}
                {submitting && triageStep && (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs text-primary animate-fade-in-up">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span className="font-semibold">{triageStep}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || description.trim().length < 10}
                  className="w-full h-11 font-bold shadow-sm hover:shadow-glow-sm transition-all text-sm"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing AI Triage…
                    </span>
                  ) : (
                    "Submit & Run AI Triage"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tips & Guidance Sidebar */}
        <div className="space-y-4">
          <Card className="border-border/70 bg-card/60 p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-primary">
              <Lightbulb className="h-4 w-4" /> Helpful Tips
            </div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span>Include invoice numbers or transaction IDs for billing inquiries.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span>Mention browser or device details for technical errors.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span>Clear details help the AI accurately detect urgency and assign higher priority.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
