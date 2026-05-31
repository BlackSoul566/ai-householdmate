import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, ListChecks, ShoppingCart, Target, Check } from "lucide-react";
import { INITIAL_NOTIFS, type Notification, type NotifKind } from "@/lib/family-data";
import { cn } from "@/lib/utils";

const ICONS: Record<NotifKind, typeof Bell> = {
  event: Calendar,
  chore: ListChecks,
  shopping: ShoppingCart,
  goal: Target,
};

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>(INITIAL_NOTIFS);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((i) => i.unread).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAll = () => setItems((s) => s.map((i) => ({ ...i, unread: false })));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-border bg-surface shadow-brand">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-semibold">Notifications</div>
            <button
              onClick={markAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <Check className="size-3" /> Mark all read
            </button>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.map((n) => {
              const Icon = ICONS[n.kind];
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 border-b border-border px-4 py-3 last:border-0",
                    n.unread && "bg-brand-soft/40",
                  )}
                >
                  <div className="mt-0.5 grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.body}</div>
                    <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {n.time}
                    </div>
                  </div>
                  {n.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
