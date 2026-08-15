import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, PlusCircle, ShieldCheck, LogOut, Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSession, clearToken } from "@/integrations/auth/client";
import { getProfile } from "@/lib/auth.functions";
import { NotificationBell } from "@/components/ui/notification-bell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth" });
    return {
      user: {
        id: session.userId,
        role: session.role,
      },
    };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const doGetProfile = useServerFn(getProfile);

  const isAdmin = user.role === "admin";

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => doGetProfile({}),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    clearToken();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/dashboard", label: "My Complaints", icon: LayoutDashboard },
    { to: "/new", label: "Submit Ticket", icon: PlusCircle },
    ...(isAdmin ? [{ to: "/admin", label: "Admin Console", icon: ShieldCheck }] : []),
  ] as const;

  return (
    <div className="flex min-h-screen bg-gradient-surface selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-sidebar/80 backdrop-blur-xl text-sidebar-foreground md:flex md:flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6 font-bold text-base tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <Link to="/dashboard" className="hover:opacity-90 transition-opacity">
              Resolvely
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {nav.map((n) => {
              const isActive = pathname === n.to || pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <n.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive && "text-primary-foreground")} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-background/50 border border-border/40">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
              {profile?.fullName ? profile.fullName.charAt(0) : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-xs text-foreground">
                {profile?.fullName ?? profile?.email ?? user.id}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                {isAdmin ? (
                  <span className="text-primary font-bold">Admin</span>
                ) : (
                  <span>User</span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-2.5 font-bold text-base md:hidden">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>Resolvely</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden h-9 w-9"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="border-b border-border/80 bg-card/95 p-4 backdrop-blur-xl md:hidden space-y-3 animate-fade-in-up">
            <nav className="space-y-1">
              {nav.map((n) => {
                const isActive = pathname === n.to || pathname.startsWith(n.to + "/");
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground"
                    )}
                  >
                    <n.icon className="h-4 w-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-border/50">
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Route View */}
        <main className="min-w-0 flex-1 p-4 md:p-8 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
