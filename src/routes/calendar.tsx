import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FAMILY, TODAY_SCHEDULE, memberByKey, type MemberKey } from "@/lib/family-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Family Calendar — FamilyFlow AI" },
      {
        name: "description",
        content:
          "A shared color-coded calendar for the whole family. Track events, birthdays, and appointments.",
      },
      { property: "og:title", content: "Family Calendar — FamilyFlow AI" },
      {
        property: "og:description",
        content: "A shared color-coded family calendar with month, week, and day views.",
      },
    ],
  }),
  component: CalendarPage,
});

type View = "month" | "week" | "day";

interface CalendarEvent {
  day: number; // day of month
  title: string;
  member: MemberKey;
  time: string;
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  { day: 3, title: "Dentist", member: "mom", time: "10:00" },
  { day: 5, title: "Piano", member: "sarah", time: "16:00" },
  { day: 8, title: "Soccer", member: "jake", time: "17:30" },
  { day: 12, title: "Grandma's Birthday", member: "mom", time: "All day" },
  { day: 14, title: "Date Night", member: "dad", time: "19:00" },
  { day: 15, title: "Piano Recital", member: "sarah", time: "18:00" },
  { day: 18, title: "Work Trip", member: "dad", time: "All day" },
  { day: 22, title: "School Play", member: "jake", time: "17:00" },
  { day: 24, title: "Uncle Mike B-day", member: "dad", time: "All day" },
  { day: 28, title: "Family Brunch", member: "mom", time: "11:00" },
];

export default function CalendarPage() {
  const [view, setView] = useState<View>("month");
  const [filterMembers, setFilterMembers] = useState<Set<MemberKey>>(
    new Set(FAMILY.map((f) => f.key)),
  );

  const events = useMemo(
    () => SAMPLE_EVENTS.filter((e) => filterMembers.has(e.member)),
    [filterMembers],
  );

  const toggleMember = (key: MemberKey) => {
    setFilterMembers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">March 2026</h1>
          <p className="text-sm text-muted-foreground">
            {events.length} events across your family this month
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
            <button
              type="button"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex items-center rounded-xl border border-border bg-surface p-1 text-sm font-medium">
            {(["month", "week", "day"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-lg px-3 py-1.5 capitalize transition-colors",
                  view === v
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Member filter */}
      <div className="flex flex-wrap gap-2">
        {FAMILY.map((m) => {
          const active = filterMembers.has(m.key);
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => toggleMember(m.key)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "border-transparent bg-surface text-foreground shadow-sm"
                  : "border-border bg-transparent text-muted-foreground opacity-60",
              )}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: m.colorVar }}
              />
              {m.name}
            </button>
          );
        })}
      </div>

      {view === "month" && <MonthView events={events} />}
      {view === "week" && <WeekView events={events} />}
      {view === "day" && <DayView />}
    </div>
  );
}

function MonthView({ events }: { events: CalendarEvent[] }) {
  // Build a 5-week grid starting Sunday Mar 1 2026 (which is Sunday in reality close enough)
  const daysInMonth = 31;
  const startDow = 0; // Sunday for simplicity
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < startDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const today = 14;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c, i) => {
          const dayEvents = c.day ? events.filter((e) => e.day === c.day) : [];
          const isToday = c.day === today;
          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] border-b border-r border-border p-2 text-xs last:border-r-0",
                (i + 1) % 7 === 0 && "border-r-0",
                !c.day && "bg-secondary/30",
              )}
            >
              {c.day && (
                <>
                  <div
                    className={cn(
                      "mb-1 inline-grid size-6 place-items-center rounded-full text-xs font-semibold",
                      isToday ? "bg-brand text-brand-foreground" : "text-foreground",
                    )}
                  >
                    {c.day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((e, idx) => {
                      const m = memberByKey(e.member);
                      return (
                        <div
                          key={idx}
                          className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: m.colorVar }}
                          title={`${e.title} • ${e.time}`}
                        >
                          {e.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ events }: { events: CalendarEvent[] }) {
  const weekDays = [10, 11, 12, 13, 14, 15, 16];
  const labels = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
  return (
    <div className="grid grid-cols-7 gap-3">
      {weekDays.map((d, i) => {
        const dayEvents = events.filter((e) => e.day === d);
        const isToday = d === 14;
        return (
          <div
            key={d}
            className={cn(
              "min-h-[200px] rounded-2xl border border-border bg-surface p-3 shadow-sm",
              isToday && "ring-2 ring-brand",
            )}
          >
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {labels[i]}
              </p>
              <p className={cn("text-xl font-bold", isToday && "text-brand")}>{d}</p>
            </div>
            <div className="space-y-2">
              {dayEvents.map((e, idx) => {
                const m = memberByKey(e.member);
                return (
                  <div
                    key={idx}
                    className="rounded-lg p-2 text-xs"
                    style={{ backgroundColor: `color-mix(in oklab, ${m.colorVar} 18%, transparent)` }}
                  >
                    <p className="font-semibold" style={{ color: m.colorVar }}>
                      {e.time}
                    </p>
                    <p className="font-medium text-foreground">{e.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold">Tuesday, March 14</h2>
      <div className="relative space-y-6">
        <div aria-hidden className="absolute top-0 left-2.5 h-full w-px bg-border" />
        {TODAY_SCHEDULE.map((evt) => {
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
    </div>
  );
}
