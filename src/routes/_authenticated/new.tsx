import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Sparkles } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(3, "Title too short").max(200),
  description: z.string().trim().min(10, "Please describe the issue").max(4000),
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ title, description });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    try {
      toast.info("AI is triaging your ticket…");

      // Step 1: AI classify (server-side)
      const classification = await classify({ data: parsed.data });

      // Step 2: Persist via server function — userId is set server-side from JWT
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
        `Submitted — classified as ${classification.category} · ${classification.priority}`
      );
      navigate({ to: "/complaints/$id", params: { id: complaint.id } });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Submit a complaint</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Describe the issue clearly. AI will categorize and prioritize it automatically.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> New ticket
          </CardTitle>
          <CardDescription>You'll get an ID you can track in your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="What happened? When? What did you expect?"
                maxLength={4000}
                required
              />
              <div className="text-right text-xs text-muted-foreground">
                {description.length}/4000
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting…" : "Submit complaint"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
