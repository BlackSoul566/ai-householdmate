import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Target, Flame, Plus, Users, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "@/lib/db/hooks";
import { goalsQuery, membersQuery, type GoalRow } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Goals & Habits — FamilyFlow AI" },
      { name: "description", content: "Track family and individual goals with progress and streaks." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const { familyId, userId } = useFamilyContext();
  const qc = useQueryClient();
  const { data: goals = [], isLoading } = useQuery({
    ...goalsQuery(familyId ?? ""),
    enabled: !!familyId,
  });
  const { data: members = [] } = useQuery({
    ...membersQuery(familyId ?? ""),
    enabled: !!familyId,
  });

  const [filter, setFilter] = useState<"all" | "family" | "individual">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    emoji: "🎯",
    kind: "family" as "family" | "individual",
    owner_id: "",
    target: 10,
    unit: "",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["goals", familyId] });

  const create = useMutation({
    mutationFn: async () => {
      if (!familyId || !userId) throw new Error("Not ready");
      if (!form.title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("goals").insert({
        family_id: familyId,
        title: form.title.trim(),
        emoji: form.emoji || "🎯",
        kind: form.kind,
        owner_id: form.kind === "individual" ? form.owner_id || null : null,
        target: form.target,
        current: 0,
        unit: form.unit,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setForm({ title: "", emoji: "🎯", kind: "family", owner_id: "", target: 10, unit: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logProgress = useMutation({
    mutationFn: async (g: GoalRow) => {
      const next = Math.min(Number(g.target), Number(g.current) + 1);
      const today = new Date().toISOString().slice(0, 10);
      const isConsecutive =
        g.last_logged_on &&
        (new Date(today).getTime() - new Date(g.last_logged_on).getTime()) / 86400000 <= 1.5;
      const streak = g.last_logged_on === today ? g.streak : isConsecutive ? g.streak + 1 : 1;
      const { error } = await supabase
        .from("goals")
        .update({ current: next, streak, last_logged_on: today })
        .eq("id", g.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = goals.filter((g) => filter === "all" || g.kind === filter);

  const familyGoals = goals.filter((g) => g.kind === "family");
  const familyProgress = useMemo(() => {
    if (familyGoals.length === 0) return 0;
    return Math.round(
      (familyGoals.reduce((a, g) => a + Number(g.current) / Math.max(1, Number(g.target)), 0) /
        familyGoals.length) *
        100,
    );
  }, [familyGoals]);

  const longestStreak = goals.reduce((m, g) => Math.max(m, g.streak), 0);
  const memberById = (id: string | null) => members.find((m) => m.id === id);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals & Habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track family ambitions and personal streaks.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-brand transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          New goal
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Family progress</div>
          <div className="mt-2 text-3xl font-bold">{familyProgress}%</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand" style={{ width: `${familyProgress}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active goals</div>
          <div className="mt-2 text-3xl font-bold">{goals.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {familyGoals.length} family · {goals.length - familyGoals.length} individual
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand-soft to-accent-soft p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand">
            <Flame className="size-3.5" /> Longest streak
          </div>
          <div className="mt-2 text-3xl font-bold">{longestStreak} days</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "family", "individual"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f ? "bg-brand text-brand-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="size-5 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No goals yet. Create your first one.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((g) => {
            const pct = Math.round((Number(g.current) / Math.max(1, Number(g.target))) * 100);
            const owner = memberById(g.owner_id);
            return (
              <div key={g.id} className="group rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-xl bg-brand-soft text-2xl">{g.emoji}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Target className="size-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g.kind}</span>
                      </div>
                      <h3 className="mt-0.5 text-base font-semibold">{g.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {owner ? (
                      <div
                        className="grid size-8 place-items-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: owner.color }}
                        title={owner.name}
                      >
                        {owner.initial}
                      </div>
                    ) : (
                      <div className="grid size-8 place-items-center rounded-full bg-secondary text-muted-foreground">
                        <Users className="size-4" />
                      </div>
                    )}
                    <button
                      onClick={() => remove.mutate(g.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Delete goal"
                    >
                      <X className="size-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">
                      {Number(g.current).toLocaleString()} {g.unit && g.unit}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      of {Number(g.target).toLocaleString()} {g.unit}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-brand">{pct}% complete</span>
                    {g.streak > 0 && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Flame className="size-3 text-orange-500" /> {g.streak}-day streak
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => logProgress.mutate(g)}
                  disabled={Number(g.current) >= Number(g.target)}
                  className="mt-4 w-full rounded-lg bg-brand-soft px-3 py-2 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-50"
                >
                  + Log progress
                </button>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold">New goal</h2>
            <div className="flex gap-2">
              <input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                maxLength={4}
                className="w-16 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-center text-lg outline-none focus:border-brand"
              />
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Goal title"
                maxLength={120}
                className="flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as "family" | "individual" })}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="family">Family</option>
                <option value="individual">Individual</option>
              </select>
              {form.kind === "individual" ? (
                <select
                  value={form.owner_id}
                  onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
                  className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="">Pick member…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : <div />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
                placeholder="Target"
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="Unit (e.g. €, books)"
                maxLength={20}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
              >
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
