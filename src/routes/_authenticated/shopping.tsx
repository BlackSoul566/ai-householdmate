import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "@/lib/db/hooks";
import { shoppingQuery, type ShoppingRow } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/shopping")({
  head: () => ({
    meta: [
      { title: "Shopping List — FamilyFlow AI" },
      { name: "description", content: "Shared grocery and household shopping list." },
    ],
  }),
  component: ShoppingPage,
});

const CATEGORIES = ["Produce", "Dairy", "Bakery", "Pantry", "Household", "Meat", "Frozen"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLOR: Record<Category, string> = {
  Produce: "bg-green-500",
  Dairy: "bg-orange-400",
  Bakery: "bg-amber-500",
  Pantry: "bg-rose-400",
  Household: "bg-sky-500",
  Meat: "bg-red-500",
  Frozen: "bg-cyan-400",
};

function ShoppingPage() {
  const { familyId, userId } = useFamilyContext();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    ...shoppingQuery(familyId ?? ""),
    enabled: !!familyId,
  });

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Produce");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["shopping", familyId] });

  const add = useMutation({
    mutationFn: async () => {
      const name = newName.trim();
      if (!name) throw new Error("Name required");
      if (!familyId || !userId) throw new Error("Not ready");
      if (items.some((i) => i.name.toLowerCase() === name.toLowerCase() && !i.done)) {
        throw new Error("Already on the list");
      }
      const { error } = await supabase.from("shopping_items").insert({
        family_id: familyId,
        name,
        category: newCategory,
        added_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (i: ShoppingRow) => {
      const { error } = await supabase.from("shopping_items").update({ done: !i.done }).eq("id", i.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shopping_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const clearDone = useMutation({
    mutationFn: async () => {
      if (!familyId) return;
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("family_id", familyId)
        .eq("done", true);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingRow[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const i of items) {
      if (!map.has(i.category)) map.set(i.category, []);
      map.get(i.category)!.push(i);
    }
    return map;
  }, [items]);

  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const aiCount = items.filter((i) => i.ai_suggested && !i.done).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-sm text-muted-foreground">
            {done} of {total} items collected{aiCount > 0 && ` • ${aiCount} AI suggestions waiting`}
          </p>
        </div>
        {done > 0 && (
          <button
            type="button"
            onClick={() => clearDone.mutate()}
            className="text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            Clear {done} completed
          </button>
        )}
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-sm"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={80}
          placeholder="Add an item to the family list…"
          className="flex-1 min-w-[180px] rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as Category)}
          className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-brand"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={add.isPending || !familyId}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-brand transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add
        </button>
      </form>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="size-5 animate-spin text-brand" /></div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Your shopping list is empty. Add the first item above.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from(grouped.entries()).map(([cat, list]) => {
            if (list.length === 0) return null;
            const color = CATEGORY_COLOR[cat as Category] ?? "bg-muted-foreground";
            return (
              <section key={cat} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", color)} />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{cat}</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{list.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {list.map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/60",
                        item.ai_suggested && !item.done && "border border-accent-soft bg-accent-soft/40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggle.mutate(item)}
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded border text-[10px]",
                          item.done ? "border-brand bg-brand text-brand-foreground" : "border-border bg-surface",
                        )}
                      >
                        {item.done ? "✓" : ""}
                      </button>
                      <span className={cn("flex-1 text-sm font-medium", item.done && "text-muted-foreground line-through")}>
                        {item.name}
                      </span>
                      {item.ai_suggested && !item.done && (
                        <span className="text-[10px] font-bold text-accent">AI</span>
                      )}
                      <button
                        type="button"
                        onClick={() => remove.mutate(item.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
