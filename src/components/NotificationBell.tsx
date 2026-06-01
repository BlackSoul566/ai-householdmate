import { useState } from "react";
import { Bell, Check, Trash2, Calendar, ListChecks, ShoppingCart, Target, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notificationsQuery, type NotificationRow } from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const ICONS = {
  event: Calendar,
  chore: ListChecks,
  shopping: ShoppingCart,
  goal: Target,
  family: Info,
  system: Info,
} as const;

export function NotificationBell({ familyId }: { familyId?: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data: notifs = [] } = useQuery({
    ...notificationsQuery(familyId ?? ""),
    enabled: !!familyId,
  });
  const unread = notifs.filter((n) => !n.read_at).length;

  const toggleRead = useMutation({
    mutationFn: async (n: NotificationRow) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: n.read_at ? null : new Date().toISOString() })
        .eq("id", n.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e) => toast.error(e.message),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      if (!familyId) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("family_id", familyId)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-surface p-2 shadow-lg">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="text-sm font-semibold">Notifications</div>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {notifs.length === 0 && (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  No notifications yet
                </div>
              )}
              {notifs.map((n) => {
                const Icon = ICONS[n.kind] ?? Info;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group flex gap-2 rounded-xl p-3",
                      !n.read_at && "bg-brand-soft/40",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-brand mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      {n.body && (
                        <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                      )}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => toggleRead.mutate(n)}
                        className="text-muted-foreground hover:text-foreground"
                        title={n.read_at ? "Mark unread" : "Mark read"}
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        onClick={() => remove.mutate(n.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
