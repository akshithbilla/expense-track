import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Search, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getSessionUser, signOut } from "@/lib/server-auth";
import { ExpenseDialog } from "@/components/expense-dialog";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Your money at a glance" },
  "/expenses": { title: "Expenses", subtitle: "All your transactions" },
  "/analytics": { title: "Analytics", subtitle: "Understand your spending" },
  "/budgets": { title: "Budgets", subtitle: "Stay in control" },
  "/calendar": { title: "Calendar", subtitle: "Spending by day" },
  "/settings": { title: "Settings", subtitle: "Preferences and data" },
};

function AppLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  useEffect(() => { getSessionUser().then((user) => { if (!user) void navigate({ to: "/login" }); else setName(user.name); }).finally(() => setReady(true)); }, [navigate]);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const meta = TITLES[path] ?? { title: "Spendly", subtitle: "" };
  const { theme, setTheme, resolved } = useTheme();

  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading your workspace…</div>;
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur-xl sm:px-6">
            <SidebarTrigger className="shrink-0" />
            <div className="hidden min-w-0 flex-col sm:flex">
              <h1 className="truncate text-sm font-semibold tracking-tight">{meta.title}</h1>
              <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." className="h-9 w-56 pl-8 text-sm" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
                title={`Theme: ${theme}`}
              >
                {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={async () => { await signOut(); await navigate({ to: "/" }); }}><LogOut className="mr-1.5 h-4 w-4" /> {name ? "Sign out" : "Exit"}</Button>
              <ExpenseDialog />
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
