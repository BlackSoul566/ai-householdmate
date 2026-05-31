import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Target, Flame, Plus, Users, User } from "lucide-react";
import { INITIAL_GOALS, memberByKey, type Goal } from "@/lib/family-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals & Habits — FamilyFlow AI" },
      { name: "description", content: "Track family and individual goals with progress charts and streaks." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [filter, setFilter] = useState<"all" | "family" | "individual">("all");

  const bump = (id: string) =>
    setGoals((gs) =>
      gs.map((g) => (g.id === id ? { ...g, current: Math.min(g.target, g.current + 1) } : g)),
    );

  const filtered = goals.filter((g) => filter === "all" || g.kind === filter);

  const familyProgress =
    Math.round(
      (goals
        .filter((g) => g.kind === "family")
        .reduce((a, g) => a + g.current / g.target, 0) /
        Math.max(1, goals.filter((g) => g.kind === "family").length)) *
        100,
    ) || 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals & Habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track family ambitions and personal streaks. Small wins, every day.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-brand transition-opacity hover:opacity-90">
          <Plus className="size-4" />
          New goal
        </button>
      </header>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Family progress
          </div>
          <div className="mt-2 text-3xl font-bold">{familyProgress}%</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand" style={{ width: `${familyProgress}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active goals
          </div>
          <div className="mt-2 text-3xl font-bold">{goals.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {goals.filter((g) => g.kind === "family").length} family ·{" "}
            {goals.filter((g) => g.kind === "individual").length} individual
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand-soft to-accent-soft p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand">
            <Flame className="size-3.5" /> Longest streak
          </div>
          <div className="mt-2 text-3xl font-bold">
            {Math.max(...goals.map((g) => g.streak ?? 0))} days
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Mom · Daily Meditation</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "family", "individual"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Goal cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((g) => {
          const pct = Math.round((g.current / g.target) * 100);
          const owner = g.owner ? memberByKey(g.owner) : null;
          return (
            <div key={g.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-xl bg-brand-soft text-2xl">
                    {g.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="size-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {g.kind}
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-base font-semibold">{g.title}</h3>
                  </div>
                </div>
                {owner ? (
                  <div
                    className="grid size-8 place-items-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: owner.colorVar }}
                    title={owner.name}
                  >
                    {owner.initial}
                  </div>
                ) : (
                  <div className="grid size-8 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <Users className="size-4" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">
                    {g.current.toLocaleString()} {g.unit !== "€" && g.unit}
                    {g.unit === "€" && ` ${g.unit}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    of {g.target.toLocaleString()} {g.unit}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-brand">{pct}% complete</span>
                  {g.streak !== undefined && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Flame className="size-3 text-orange-500" /> {g.streak}-day streak
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => bump(g.id)}
                  className="flex-1 rounded-lg bg-brand-soft px-3 py-2 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
                >
                  + Log progress
                </button>
                <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary">
                  <User className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
