import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy, Plus, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "@/lib/db/hooks";
import { choresQuery, membersQuery, type ChoreRow, type FamilyMember } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chores")({
  head: () => ({
    meta: [
      { title: "Chores — FamilyFlow AI" },
      { name: "description", content: "Assign and track family chores with points and rewards." },
    ],
  }),
  component: ChoresPage,
});

function ChoresPage() {
  const { familyId, userId } = useFamilyContext();
  const qc = useQueryClient();
  const { data: chores = [], isLoading } = useQuery({
    ...choresQuery(familyId ?? ""),
    enabled: !!familyId,
  });
  const { data: members = [] } = useQuery({
    ...membersQuery(familyId ?? ""),
    enabled: !!familyId,
  });

  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState<string>("");
  const [newPoints, setNewPoints] = useState(10);

  const memberById = (id: string | null) => members.find((m) => m.id === id);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["chores", familyId] });

  const createChore = useMutation({
    mutationFn: async () => {
      if (!familyId || !userId) throw new Error("Not ready");
      const title = newTitle.trim();
      if (!title) throw new Error("Title required");
      const { error } = await supabase.from("chores").insert({
        family_id: familyId,
        title,
        assigned_to: newAssignee || null,
        points: newPoints,
        status: "pending",
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTitle("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleChore = useMutation({
    mutationFn: async (c: ChoreRow) => {
      const next = c.status === "done" ? "pending" : "done";
      const { error } = await supabase
        .from("chores")
        .update({
          status: next,
          completed_at: next === "done" ? new Date().toISOString() : null,
          completed_by: next === "done" ? userId : null,
        })
        .eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const removeChore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const totals = useMemo(() => {
    const map = new Map<string, { total: number; earned: number; count: number; done: number; member: FamilyMember }>();
    for (const m of members) map.set(m.id, { total: 0, earned: 0, count: 0, done: 0, member: m });
    for (const c of chores) {
      if (!c.assigned_to) continue;
      const e = map.get(c.assigned_to);
      if (!e) continue;
      e.total += c.points;
      e.count += 1;
      if (c.status === "done") {
        e.earned += c.points;
        e.done += 1;
      }
    }
    return Array.from(map.values());
  }, [chores, members]);

  const champion = useMemo(() => {
    if (totals.length === 0) return null;
    return totals.reduce((best, t) => (t.earned > best.earned ? t : best), totals[0]);
  }, [totals]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Chores & Rewards</h1>
        <p className="text-sm text-muted-foreground">Assign tasks, earn points, celebrate progress.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {totals.map((t) => {
          const pct = t.total === 0 ? 0 : Math.round((t.earned / t.total) * 100);
          return (
            <div key={t.member.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="grid size-9 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: t.member.color }}
                >
                  {t.member.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.member.name}</p>
                  <p className="text-xs text-muted-foreground">{t.done}/{t.count} done</p>
                </div>
              </div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight">{t.earned}</span>
                <span className="text-xs text-muted-foreground">/ {t.total} pts</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: t.member.color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">All Chores</h2>
          {isLoading ? (
            <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-brand" /></div>
          ) : chores.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No chores yet. Add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {chores.map((chore) => {
                const m = memberById(chore.assigned_to);
                const done = chore.status === "done";
                return (
                  <div
                    key={chore.id}
                    className="group flex w-full items-center gap-4 rounded-xl border border-border/60 p-3 transition-colors hover:border-brand/30 hover:bg-brand-soft/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleChore.mutate(chore)}
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded border text-[10px]",
                        done ? "border-brand bg-brand text-brand-foreground" : "border-border bg-surface",
                      )}
                      aria-label={done ? "Mark not done" : "Mark done"}
                    >
                      {done ? "✓" : ""}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
                        {chore.title}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {m && (
                          <>
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                            {m.name}
                          </>
                        )}
                        {!m && <span className="italic">Unassigned</span>}
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
                      {chore.points} pts
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChore.mutate(chore.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Delete chore"
                    >
                      <X className="size-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-6">
          {champion && champion.earned > 0 && (
            <div className="rounded-2xl border border-border bg-gradient-to-br from-brand to-brand/80 p-6 text-brand-foreground shadow-brand">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
                <Trophy className="size-3.5" /> Weekly champion
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">{champion.member.name}</p>
              <p className="mt-1 text-sm opacity-90">{champion.earned} points earned this week</p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createChore.mutate();
            }}
            className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <h3 className="text-base font-bold">Add a chore</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Take out trash"
              maxLength={120}
              className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
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
              disabled={createChore.isPending || !familyId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {createChore.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add chore
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
