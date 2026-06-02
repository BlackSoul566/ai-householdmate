import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "@/lib/db/hooks";
import { eventsQuery, membersQuery, type EventRow, type FamilyMember } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Family Calendar — FamilyFlow AI" },
      { name: "description", content: "A shared color-coded family calendar." },
    ],
  }),
  component: CalendarPage,
});

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function CalendarPage() {
  const { familyId, userId } = useFamilyContext();
  const qc = useQueryClient();
  const { data: events = [], isLoading } = useQuery({
    ...eventsQuery(familyId ?? ""),
    enabled: !!familyId,
  });
  const { data: members = [] } = useQuery({
    ...membersQuery(familyId ?? ""),
    enabled: !!familyId,
  });

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [filterIds, setFilterIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    member_id: "",
    location: "",
    all_day: false,
  });

  const memberById = (id: string) => members.find((m) => m.id === id);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const startDow = cursor.getDay();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterIds.size > 0 && !e.member_ids.some((id) => filterIds.has(id))) return false;
      const d = new Date(e.start_at);
      return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth();
    });
  }, [events, filterIds, cursor]);

  const eventsOnDay = (day: number) =>
    filteredEvents.filter((e) => new Date(e.start_at).getDate() === day);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["events", familyId] });

  const create = useMutation({
    mutationFn: async () => {
      if (!familyId || !userId) throw new Error("Not ready");
      if (!form.title.trim()) throw new Error("Title required");
      const start = form.all_day
        ? new Date(form.date + "T00:00:00").toISOString()
        : new Date(form.date + "T" + form.time + ":00").toISOString();
      const { error } = await supabase.from("events").insert({
        family_id: familyId,
        title: form.title.trim(),
        start_at: start,
        all_day: form.all_day,
        location: form.location || null,
        member_ids: form.member_id ? [form.member_id] : [],
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setForm({ ...form, title: "", location: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === cursor.getFullYear() && today.getMonth() === cursor.getMonth();

  const toggleMember = (id: string) => {
    const next = new Set(filterIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFilterIds(next);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{monthLabel}</h1>
          <p className="text-sm text-muted-foreground">{filteredEvents.length} events this month</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursor(startOfMonth(new Date()))}
              className="rounded-lg px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-brand transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" /> New event
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const active = filterIds.size === 0 || filterIds.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMember(m.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "border-transparent bg-surface text-foreground shadow-sm"
                  : "border-border bg-transparent text-muted-foreground opacity-60",
              )}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              {m.name}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-brand" /></div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dayEvents = day ? eventsOnDay(day) : [];
                const isToday = isCurrentMonth && day === today.getDate();
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[110px] border-b border-r border-border p-2 text-xs last:border-r-0",
                      (i + 1) % 7 === 0 && "border-r-0",
                      !day && "bg-secondary/30",
                    )}
                  >
                    {day && (
                      <>
                        <div className={cn("mb-1 inline-grid size-6 place-items-center rounded-full text-xs font-semibold", isToday ? "bg-brand text-brand-foreground" : "text-foreground")}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((e) => {
                            const m = (e.member_ids[0] ? memberById(e.member_ids[0]) : null) ?? null;
                            const color = m?.color ?? "var(--brand)";
                            return (
                              <EventPill key={e.id} event={e} color={color} member={m} onDelete={() => remove.mutate(e.id)} />
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

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
            <h2 className="text-lg font-bold">New event</h2>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Event title"
              maxLength={120}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                disabled={form.all_day}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-50"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.all_day} onChange={(e) => setForm({ ...form, all_day: e.target.checked })} />
              All day
            </label>
            <select
              value={form.member_id}
              onChange={(e) => setForm({ ...form, member_id: e.target.value })}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="">Whole family</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location (optional)"
              maxLength={120}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <div className="flex justify-end gap-2 pt-1">
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

function EventPill({
  event,
  color,
  member,
  onDelete,
}: {
  event: EventRow;
  color: string;
  member: FamilyMember | null;
  onDelete: () => void;
}) {
  const d = new Date(event.start_at);
  const time = event.all_day
    ? "All day"
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div
      className="group relative truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
      style={{ backgroundColor: color }}
      title={`${event.title} • ${time}${member ? " • " + member.name : ""}`}
    >
      {event.title}
      <button
        onClick={onDelete}
        className="absolute right-0.5 top-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Delete event"
      >
        <X className="size-2.5" />
      </button>
    </div>
  );
}
