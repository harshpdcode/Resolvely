/**
 * Google OAuth callback route.
 * Google redirects here after user grants permission.
 * Exchanges the code for a token, then redirects to /dashboard.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { handleGoogleCallback } from "@/lib/auth.functions";
import { saveToken } from "@/integrations/auth/client";
import { Sparkles } from "lucide-react";

const searchSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback/google")({
  validateSearch: searchSchema,
  component: GoogleCallback,
});

function GoogleCallback() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const doHandleCallback = useServerFn(handleGoogleCallback);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (search.error) {
      setStatus("error");
      setErrorMsg(search.error_description ?? search.error);
      return;
    }

    if (!search.code) {
      setStatus("error");
      setErrorMsg("No authorization code received from Google.");
      return;
    }

    doHandleCallback({ data: { code: search.code } })
      .then((result) => {
        saveToken(result.token);
        toast.success(
          result.role === "admin"
            ? "Signed in with Google — you're an Admin!"
            : "Signed in with Google!"
        );
        navigate({ to: "/dashboard", replace: true });
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Authentication failed");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface">
      <div className="text-center">
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow">
          <Sparkles className="h-6 w-6" />
        </span>
        {status === "loading" ? (
          <>
            <h1 className="mt-4 text-lg font-semibold">Completing sign in…</h1>
            <p className="mt-1 text-sm text-muted-foreground">Please wait a moment.</p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-lg font-semibold text-destructive">Sign in failed</h1>
            <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
            <a href="/auth" className="mt-4 inline-block text-sm text-primary underline">
              Try again
            </a>
          </>
        )}
      </div>
    </div>
  );
}
