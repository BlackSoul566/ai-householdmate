import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy, Plus } from "lucide-react";
import { FAMILY, INITIAL_CHORES, memberByKey, type Chore, type MemberKey } from "@/lib/family-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chores")({
  head: () => ({
    meta: [
      { title: "Chores — FamilyFlow AI" },
      {
        name: "description",
        content:
          "Assign and track family chores. Reward kids with points and watch your weekly progress.",
      },
      { property: "og:title", content: "Chores — FamilyFlow AI" },
      {
        property: "og:description",
        content: "Family chore management with points, rewards, and progress charts.",
      },
    ],
  }),
  component: ChoresPage,
});

function ChoresPage() {
  const [chores, setChores] = useState<Chore[]>(INITIAL_CHORES);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState<MemberKey>("jake");
  const [newPoints, setNewPoints] = useState(10);

  const totals = useMemo(() => {
    const map = new Map<MemberKey, { total: number; earned: number; count: number; done: number }>();
    for (const m of FAMILY) map.set(m.key, { total: 0, earned: 0, count: 0, done: 0 });
    for (const c of chores) {
      const e = map.get(c.assignee)!;
      e.total += c.points;
      e.count += 1;
      if (c.done) {
        e.earned += c.points;
        e.done += 1;
      }
    }
    return map;
  }, [chores]);

  const champion = useMemo(() => {
    let best = FAMILY[0];
    let bestPts = -1;
    for (const m of FAMILY) {
      const t = totals.get(m.key)!;
      if (t.earned > bestPts) {
        bestPts = t.earned;
        best = m;
      }
    }
    return { member: best, points: bestPts };
  }, [totals]);

  const toggle = (id: string) =>
    setChores((cs) => cs.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));

  const addChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setChores((cs) => [
      ...cs,
      {
        id: `c${Date.now()}`,
        title: newTitle.trim(),
        assignee: newAssignee,
        points: newPoints,
        done: false,
      },
    ]);
    setNewTitle("");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Chores & Rewards</h1>
        <p className="text-sm text-muted-foreground">
          Assign tasks, earn points, celebrate progress.
        </p>
      </header>

      {/* Progress cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {FAMILY.map((m) => {
          const t = totals.get(m.key)!;
          const pct = t.total === 0 ? 0 : Math.round((t.earned / t.total) * 100);
          return (
            <div
              key={m.key}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="grid size-9 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: m.colorVar }}
                >
                  {m.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{t.done}/{t.count} done</p>
                </div>
              </div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight">{t.earned}</span>
                <span className="text-xs text-muted-foreground">/ {t.total} pts</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: m.colorVar }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chore list */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">All Chores</h2>
          <div className="space-y-2">
            {chores.map((chore) => {
              const m = memberByKey(chore.assignee);
              return (
                <button
                  key={chore.id}
                  type="button"
                  onClick={() => toggle(chore.id)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border/60 p-3 text-left transition-colors hover:border-brand/30 hover:bg-brand-soft/40"
                >
                  <div
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded border text-[10px]",
                      chore.done
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border bg-surface",
                    )}
                  >
                    {chore.done ? "✓" : ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        chore.done && "text-muted-foreground line-through",
                      )}
                    >
                      {chore.title}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: m.colorVar }}
                      />
                      {m.name}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
                    {chore.points} pts
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Champion + add */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-brand to-brand/80 p-6 text-brand-foreground shadow-brand">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
              <Trophy className="size-3.5" />
              Weekly champion
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight">
              {champion.member.name}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {champion.points} points earned this week
            </p>
          </div>

          <form
            onSubmit={addChore}
            className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <h3 className="text-base font-bold">Add a chore</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Take out trash"
              className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value as MemberKey)}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                {FAMILY.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={100}
                value={newPoints}
                onChange={(e) => setNewPoints(Number(e.target.value))}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              Add chore
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
