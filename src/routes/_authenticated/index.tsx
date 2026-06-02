import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFamilyContext } from "@/lib/db/hooks";
import {
  choresQuery,
  shoppingQuery,
  eventsQuery,
  membersQuery,
  goalsQuery,
} from "@/lib/db/queries";
import familyImg from "@/assets/family-breakfast.jpg";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FamilyFlow AI" },
      { name: "description", content: "Your family's day at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { familyId, family, isLoading } = useFamilyContext();
  const enabled = !!familyId;
  const { data: chores = [] } = useQuery({ ...choresQuery(familyId ?? ""), enabled });
  const { data: shopping = [] } = useQuery({ ...shoppingQuery(familyId ?? ""), enabled });
  const { data: events = [] } = useQuery({ ...eventsQuery(familyId ?? ""), enabled });
  const { data: members = [] } = useQuery({ ...membersQuery(familyId ?? ""), enabled });
  const { data: goals = [] } = useQuery({ ...goalsQuery(familyId ?? ""), enabled });

  if (isLoading || !familyId) {
    return <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-brand" /></div>;
  }

  const memberById = (id: string | null) => members.find((m) => m.id === id);
  const firstName = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there").split(" ")[0];

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  const todaysEvents = events
    .filter((e) => {
      const d = new Date(e.start_at);
      return d >= todayStart && d < todayEnd;
    })
    .slice(0, 5);

  const upcomingChores = chores.filter((c) => c.status !== "done").slice(0, 4);
  const shoppingPreview = shopping.filter((i) => !i.done).slice(0, 5);
  const aiCount = shopping.filter((i) => i.ai_suggested && !i.done).length;

  const nextEvent = todaysEvents[0];
  const briefing = nextEvent
    ? `Next up today: ${nextEvent.title} at ${new Date(nextEvent.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    : `Nothing on the calendar for today. ${upcomingChores.length} chores still need attention.`;

  // Champion: member with most points
  const champion = [...members].sort((a, b) => b.points - a.points)[0];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <section className="relative overflow-hidden rounded-3xl bg-brand p-8 text-brand-foreground shadow-brand">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="size-3" /> AI Briefing
            </span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Good day, {firstName}!
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-brand-soft">
              {briefing} {shoppingPreview.length > 0 && `Your shopping list has ${shoppingPreview.length} open items${aiCount > 0 ? `, including ${aiCount} AI suggestions` : ""}.`}
            </p>
          </div>
          <div aria-hidden className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-bl from-white/15 via-transparent to-transparent" />
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Weekly Chores</h2>
              <Link to="/chores" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingChores.length === 0 && (
                <p className="text-sm text-muted-foreground">All caught up! 🎉</p>
              )}
              {upcomingChores.map((chore) => {
                const m = memberById(chore.assigned_to);
                return (
                  <div key={chore.id} className="flex items-center gap-4 rounded-xl border border-border/60 p-3">
                    <div className="grid size-5 shrink-0 place-items-center rounded border border-border bg-surface" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{chore.title}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {m && <span className="size-1.5 rounded-full" style={{ backgroundColor: m.color }} />}
                        {m?.name ?? "Unassigned"} • {chore.points} pts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/chores" className="mt-6 flex w-full items-center justify-center rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              Manage chores
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Shopping List</h2>
              {aiCount > 0 && <span className="text-xs font-medium text-accent">{aiCount} AI suggestions</span>}
            </div>
            <div className="space-y-3">
              {shoppingPreview.length === 0 && (
                <p className="text-sm text-muted-foreground">Shopping list is empty.</p>
              )}
              {shoppingPreview.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="size-2 rounded-full bg-brand" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/shopping" className="mt-6 flex w-full items-center justify-center rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              Open shopping list
            </Link>
          </section>
        </div>

        {goals.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Goal progress</h2>
              <Link to="/goals" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {goals.slice(0, 4).map((g) => {
                const pct = Math.round((Number(g.current) / Math.max(1, Number(g.target))) * 100);
                return (
                  <div key={g.id} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.emoji} {g.title}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="space-y-8 lg:col-span-4">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-bold">Today's Schedule</h2>
          {todaysEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events scheduled for today.</p>
          ) : (
            <div className="relative space-y-6">
              <div aria-hidden className="absolute top-0 left-2.5 h-full w-px bg-border" />
              {todaysEvents.map((evt) => {
                const m = evt.member_ids[0] ? memberById(evt.member_ids[0]) : null;
                const color = m?.color ?? "var(--brand)";
                const time = evt.all_day
                  ? "All day"
                  : new Date(evt.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={evt.id} className="relative flex gap-4">
                    <div className="z-10 mt-1.5 size-5 shrink-0 rounded-full ring-4 ring-surface" style={{ backgroundColor: color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{time}</p>
                      <p className="font-semibold">{evt.title}</p>
                      {evt.location && <p className="text-xs text-muted-foreground">{evt.location}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {champion && champion.points > 0 && (
          <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <img src={familyImg} alt="Family enjoying breakfast together" width={1024} height={576} loading="lazy" className="aspect-[2/1] w-full object-cover" />
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">This week's chore champion</p>
              <h4 className="mt-1 text-2xl font-extrabold tracking-tight text-brand">
                {champion.name.toUpperCase()}
              </h4>
              <p className="text-xs font-medium text-accent">{champion.points} points earned</p>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Workspace</p>
          <p className="mt-1 text-lg font-bold">{family?.name}</p>
          <p className="text-xs text-muted-foreground">{members.length} {members.length === 1 ? "member" : "members"}</p>
        </section>
      </div>
    </div>
  );
}
