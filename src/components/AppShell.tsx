import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Calendar, ListChecks, ShoppingCart, Plus } from "lucide-react";
import { FAMILY } from "@/lib/family-data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/chores", label: "Chores", icon: ListChecks },
  { to: "/shopping", label: "Shopping", icon: ShoppingCart },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-brand shadow-brand" />
            <span className="text-xl font-bold tracking-tight text-brand">
              FamilyFlow AI
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-soft text-brand"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {FAMILY.map((m) => (
              <div
                key={m.key}
                className="grid size-8 place-items-center rounded-full text-xs font-bold text-white ring-2 ring-surface"
                style={{ backgroundColor: m.colorVar }}
                title={`${m.name} (${m.role})`}
              >
                {m.initial}
              </div>
            ))}
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              aria-label="Add family member"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
