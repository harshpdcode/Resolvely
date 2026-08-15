import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { register, login, getGoogleAuthUrl } from "@/lib/auth.functions";
import { saveToken, getSession } from "@/integrations/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Eye, EyeOff, Lock, Mail, User, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function PasswordInput({
  id,
  value,
  onChange,
  minLength,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  minLength?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={minLength}
        placeholder={placeholder}
        required={required}
        className="pr-10 bg-background/50 focus:bg-background transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function formatAuthError(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
        return parsed[0].message;
      }
    } catch {
      // ignore
    }
    return err.message;
  }
  return "Authentication failed. Please check your credentials.";
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(
    search.mode === "signup" ? "signup" : "signin"
  );
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const doRegister = useServerFn(register);
  const doLogin = useServerFn(login);
  const doGetGoogleAuthUrl = useServerFn(getGoogleAuthUrl);

  // Redirect if already logged in
  useEffect(() => {
    if (getSession()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      return toast.error("Please enter both email and password.");
    }
    setLoading(true);
    try {
      const result = await doLogin({ data: { email, password } });
      saveToken(result.token);
      toast.success("Welcome back to Resolvely!");
      navigate({ to: "/dashboard", replace: true });
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/auth")) {
          window.location.href = "/dashboard";
        }
      }, 50);
    } catch (err) {
      toast.error(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Please enter your full name.");
    if (!email.trim()) return toast.error("Please enter a valid email address.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const result = await doRegister({ data: { fullName, email, password } });
      saveToken(result.token);
      toast.success(
        result.role === "admin"
          ? "Admin Account created! You have full access."
          : "Account created successfully!"
      );
      navigate({ to: "/dashboard", replace: true });
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/auth")) {
          window.location.href = "/dashboard";
        }
      }, 50);
    } catch (err) {
      toast.error(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      const { url } = await doGetGoogleAuthUrl({});
      window.location.href = url;
    } catch (err) {
      toast.info(
        "Google OAuth is optional and requires Google Cloud API credentials. Please use standard email & password signup above!"
      );
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-surface px-4 py-12 selection:bg-primary/20 selection:text-primary">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[450px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-hero opacity-20 blur-[100px] animate-pulse-glow"
        aria-hidden="true"
      />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Back link & Logo */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> End-to-end encrypted
          </div>
        </div>

        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>Resolvely</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-powered customer ticket & complaint management
          </p>
        </div>

        <Card className="border-border/80 bg-card/90 shadow-elevated backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-center">
              {tab === "signin" ? "Sign in to your account" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-center text-xs">
              {tab === "signin"
                ? "Enter your credentials below to access your tickets"
                : "Join Resolvely to submit and track complaints with AI triage"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60">
                <TabsTrigger value="signin" className="font-semibold text-xs py-2 transition-all">
                  Sign in
                </TabsTrigger>
                <TabsTrigger value="signup" className="font-semibold text-xs py-2 transition-all">
                  Create account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5 space-y-4">
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="si-email" className="text-xs font-semibold">
                      Email address
                    </Label>
                    <div className="relative">
                      <Input
                        id="si-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="si-pass" className="text-xs font-semibold">
                      Password
                    </Label>
                    <PasswordInput
                      id="si-pass"
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-10 font-semibold shadow-sm hover:shadow-glow-sm transition-all" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5 space-y-4">
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name" className="text-xs font-semibold">
                      Full name
                    </Label>
                    <Input
                      id="su-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      autoComplete="name"
                      className="bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email" className="text-xs font-semibold">
                      Email address
                    </Label>
                    <Input
                      id="su-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-pass" className="text-xs font-semibold">
                      Password
                    </Label>
                    <PasswordInput
                      id="su-pass"
                      value={password}
                      onChange={setPassword}
                      minLength={6}
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-10 font-semibold shadow-sm hover:shadow-glow-sm transition-all" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                      </span>
                    ) : (
                      "Create free account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 hover:bg-accent/40 font-medium transition-all"
              onClick={handleGoogle}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
