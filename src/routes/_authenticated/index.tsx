import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Cake } from "lucide-react";
import {
  TODAY_SCHEDULE,
  INITIAL_CHORES,
  INITIAL_SHOPPING,
  BIRTHDAYS,
  memberByKey,
} from "@/lib/family-data";
import familyImg from "@/assets/family-breakfast.jpg";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FamilyFlow AI" },
      {
        name: "description",
        content:
          "Your family's day at a glance: AI summary, today's schedule, chore progress, and shared shopping list.",
      },
      { property: "og:title", content: "Dashboard — FamilyFlow AI" },
      {
        property: "og:description",
        content: "AI-powered family dashboard with calendar, chores, and shopping in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const upcomingChores = INITIAL_CHORES.slice(0, 3);
  const shoppingPreview = INITIAL_SHOPPING.slice(0, 4);
  const completedChores = INITIAL_CHORES.filter((c) => c.done).length;
  const champion = "Sarah";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        {/* AI Briefing */}
        <section className="relative overflow-hidden rounded-3xl bg-brand p-8 text-brand-foreground shadow-brand">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="size-3" />
              AI Briefing
            </span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Good morning, Miller Family!
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-brand-soft">
              It's a busy Tuesday. Sarah has{" "}
              <span className="font-semibold text-white underline decoration-accent decoration-2 underline-offset-4">
                Piano Practice at 4:00 PM
              </span>
              . The pantry is low on{" "}
              <span className="font-semibold text-white underline decoration-accent decoration-2 underline-offset-4">
                Oat Milk
              </span>{" "}
              and avocados. Heads up: the electricity bill is due tomorrow.
            </p>
          </div>
          <div
            aria-hidden
            className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-bl from-white/15 via-transparent to-transparent"
          />
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Chores */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Weekly Chores</h2>
              <Link
                to="/chores"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingChores.map((chore) => {
                const m = memberByKey(chore.assignee);
                return (
                  <div
                    key={chore.id}
                    className="flex items-center gap-4 rounded-xl border border-border/60 p-3 transition-colors hover:border-brand/30 hover:bg-brand-soft/40"
                  >
                    <div
                      className={
                        "grid size-5 shrink-0 place-items-center rounded border " +
                        (chore.done
                          ? "border-brand bg-brand text-[10px] text-brand-foreground"
                          : "border-border bg-surface")
                      }
                    >
                      {chore.done ? "✓" : ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={
                          "truncate text-sm font-medium " +
                          (chore.done ? "text-muted-foreground line-through" : "")
                        }
                      >
                        {chore.title}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: m.colorVar }}
                        />
                        {m.name} • {chore.points} pts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              to="/chores"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Manage chores
            </Link>
          </section>

          {/* Shopping */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Shopping List</h2>
              <span className="text-xs font-medium text-accent">
                {INITIAL_SHOPPING.filter((i) => i.aiSuggested).length} AI suggestions
              </span>
            </div>
            <div className="space-y-3">
              {shoppingPreview.map((item) => (
                <div
                  key={item.id}
                  className={
                    "flex items-center justify-between rounded-lg " +
                    (item.aiSuggested
                      ? "-mx-2 border border-accent-soft bg-accent-soft/50 p-2"
                      : "")
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "size-2 rounded-full " +
                        (item.aiSuggested ? "animate-pulse bg-brand" : categoryDot(item.category))
                      }
                    />
                    <span
                      className={
                        "text-sm font-medium " +
                        (item.aiSuggested ? "italic text-accent-foreground" : "")
                      }
                    >
                      {item.name}
                    </span>
                  </div>
                  {item.aiSuggested ? (
                    <span className="text-[10px] font-bold text-accent">AI SUGGESTED</span>
                  ) : (
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                      {item.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <Link
              to="/shopping"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Open shopping list
            </Link>
          </section>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-8 lg:col-span-4">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-bold">Today's Schedule</h2>
          <div className="relative space-y-6">
            <div
              aria-hidden
              className="absolute top-0 left-2.5 h-full w-px bg-border"
            />
            {TODAY_SCHEDULE.slice(0, 4).map((evt) => {
              const m = memberByKey(evt.member);
              return (
                <div key={evt.id} className="relative flex gap-4">
                  <div
                    className="z-10 mt-1.5 size-5 shrink-0 rounded-full ring-4 ring-surface"
                    style={{ backgroundColor: m.colorVar }}
                  />
                  <div className="min-w-0">
                    <p
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: m.colorVar }}
                    >
                      {evt.time}
                    </p>
                    <p className="font-semibold">{evt.title}</p>
                    <p className="text-xs text-muted-foreground">{evt.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="mb-4 text-sm font-bold text-muted-foreground">
              Upcoming Birthdays
            </h3>
            <div className="space-y-2">
              {BIRTHDAYS.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 rounded-xl bg-accent-soft/60 p-4"
                >
                  <div className="grid size-10 place-items-center rounded-lg bg-accent/15 text-xl">
                    <Cake className="size-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      In {b.inDays} days • {b.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Champion card */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <img
            src={familyImg}
            alt="Family enjoying breakfast together"
            width={1024}
            height={576}
            loading="lazy"
            className="aspect-[2/1] w-full object-cover"
          />
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">This week's chore champion</p>
            <h4 className="mt-1 text-2xl font-extrabold tracking-tight text-brand">
              {champion.toUpperCase()} MILLER
            </h4>
            <p className="text-xs font-medium text-accent">
              {completedChores * 35 + 145} points earned
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function categoryDot(category: string): string {
  switch (category) {
    case "Produce":
      return "bg-green-500";
    case "Dairy":
      return "bg-orange-400";
    case "Bakery":
      return "bg-amber-500";
    case "Household":
      return "bg-sky-500";
    case "Pantry":
      return "bg-rose-400";
    default:
      return "bg-muted-foreground";
  }
}
