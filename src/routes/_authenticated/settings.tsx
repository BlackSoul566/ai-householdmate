import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Bell, Users, Shield, Plus } from "lucide-react";
import { FAMILY } from "@/lib/family-data";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FamilyFlow AI" },
      { name: "description", content: "Manage your family profile, notifications, and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your family workspace.
        </p>
      </header>

      {/* Family */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4 text-brand" /> Family members
        </div>
        <ul className="divide-y divide-border">
          {FAMILY.map((m) => (
            <li key={m.key} className="flex items-center gap-3 py-3">
              <div
                className="grid size-10 place-items-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: m.colorVar }}
              >
                {m.initial}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </div>
              <button className="text-xs font-medium text-brand hover:underline">Edit</button>
            </li>
          ))}
        </ul>
        <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:border-brand hover:text-brand">
          <Plus className="size-4" /> Add family member
        </button>
      </section>

      {/* Appearance */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          {theme === "dark" ? <Moon className="size-4 text-brand" /> : <Sun className="size-4 text-brand" />}
          Appearance
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Dark mode</div>
            <div className="text-xs text-muted-foreground">
              Currently using <strong className="capitalize">{theme}</strong> theme.
            </div>
          </div>
          <button
            onClick={toggle}
            className="relative h-6 w-11 rounded-full bg-secondary transition-colors data-[on=true]:bg-brand"
            data-on={theme === "dark"}
            aria-label="Toggle dark mode"
          >
            <span
              className="absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow transition-transform"
              style={{ transform: theme === "dark" ? "translateX(20px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Bell className="size-4 text-brand" /> Notifications
        </div>
        <div className="space-y-3">
          {[
            ["Upcoming events", true],
            ["Overdue chores", true],
            ["Shopping reminders", true],
            ["Goal milestones", false],
          ].map(([label, on]) => (
            <label key={label as string} className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <input type="checkbox" defaultChecked={on as boolean} className="size-4 accent-[var(--brand)]" />
            </label>
          ))}
        </div>
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Shield className="size-4 text-brand" /> Account
        </div>
        <p className="text-xs text-muted-foreground">
          Family workspace: <strong>The Johnsons</strong> · 4 members · Free plan
        </p>
      </section>
    </div>
  );
}
