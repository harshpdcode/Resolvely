import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, PlusCircle, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return Boolean(data);
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/dashboard", label: "My complaints", icon: LayoutDashboard },
    { to: "/new", label: "Submit", icon: PlusCircle },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ] as const;

  return (
    <div className="flex min-h-screen bg-gradient-surface">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-6 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          Resolvely
        </div>
        <nav className="flex-1 p-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                pathname === n.to || pathname.startsWith(n.to + "/")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 px-3 text-xs">
            <div className="truncate font-medium text-foreground">{profile?.full_name ?? user.email}</div>
            <div className="truncate text-muted-foreground">{profile?.email ?? user.email}</div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card/70 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 font-semibold md:hidden">
            <Sparkles className="h-4 w-4 text-primary" /> Resolvely
          </div>
          <div className="ml-auto md:hidden">
            <Button variant="outline" size="sm" onClick={() => setMobileOpen((v) => !v)}>Menu</Button>
          </div>
        </header>
        {mobileOpen && (
          <div className="border-b bg-card px-4 py-2 md:hidden">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-accent">
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
            <button onClick={signOut} className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-accent">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
