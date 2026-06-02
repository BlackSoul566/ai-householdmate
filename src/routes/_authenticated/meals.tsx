import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChefHat, Sparkles, ShoppingBasket, Plus, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "@/lib/db/hooks";
import { mealsQuery } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/meals")({
  head: () => ({
    meta: [
      { title: "Meal Planner — FamilyFlow AI" },
      { name: "description", content: "Plan family meals for the week and auto-generate shopping lists." },
    ],
  }),
  component: MealsPage,
});

const SLOTS = ["breakfast", "lunch", "dinner"] as const;
type Slot = (typeof SLOTS)[number];
const DIETARY_PREFS = ["Vegetarian", "Vegan", "Gluten-free", "Pescatarian", "Dairy-free"];

const RECIPE_SUGGESTIONS = [
  { title: "Mediterranean Bowl", dietary_tags: ["Vegetarian"], ingredients: ["Quinoa", "Chickpeas", "Cucumber", "Feta", "Olive Oil"] },
  { title: "Beef Stir Fry", dietary_tags: [], ingredients: ["Flank Steak", "Bell Pepper", "Soy Sauce", "Ginger", "Rice"] },
  { title: "Lentil Soup", dietary_tags: ["Vegan", "Gluten-free"], ingredients: ["Lentils", "Carrots", "Celery", "Onion", "Cumin"] },
  { title: "Shrimp Tacos", dietary_tags: ["Pescatarian"], ingredients: ["Shrimp", "Tortillas", "Cabbage", "Lime", "Avocado"] },
];

function startOfWeek(d = new Date()) {
  const day = d.getDay(); // 0 Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MealsPage() {
  const { familyId, userId } = useFamilyContext();
  const qc = useQueryClient();
  const { data: meals = [], isLoading } = useQuery({
    ...mealsQuery(familyId ?? ""),
    enabled: !!familyId,
  });

  const [prefs, setPrefs] = useState<string[]>(["Vegetarian"]);
  const [editing, setEditing] = useState<{ date: string; slot: Slot } | null>(null);
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");

  const weekStart = useMemo(() => startOfWeek(), []);
  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d.toISOString().slice(0, 10);
      }),
    [weekStart],
  );

  const mealAt = (date: string, slot: Slot) => meals.find((m) => m.date === date && m.slot === slot);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["meals", familyId] });
  const invalidateShopping = () => qc.invalidateQueries({ queryKey: ["shopping", familyId] });

  const upsertMeal = useMutation({
    mutationFn: async (payload: { date: string; slot: Slot; title: string; ingredients: string[]; dietary_tags?: string[] }) => {
      if (!familyId || !userId) throw new Error("Not ready");
      const existing = mealAt(payload.date, payload.slot);
      if (existing) {
        const { error } = await supabase
          .from("meals")
          .update({ title: payload.title, ingredients: payload.ingredients, dietary_tags: payload.dietary_tags ?? [] })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meals").insert({
          family_id: familyId,
          date: payload.date,
          slot: payload.slot,
          title: payload.title,
          ingredients: payload.ingredients,
          dietary_tags: payload.dietary_tags ?? [],
          created_by: userId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setEditing(null);
      setTitle("");
      setIngredients("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const generateShopping = useMutation({
    mutationFn: async () => {
      if (!familyId || !userId) throw new Error("Not ready");
      const allIngredients = Array.from(new Set(meals.flatMap((m) => m.ingredients).filter(Boolean)));
      if (allIngredients.length === 0) throw new Error("Plan some meals first");
      const { data: existing } = await supabase
        .from("shopping_items")
        .select("name")
        .eq("family_id", familyId)
        .eq("done", false);
      const have = new Set((existing ?? []).map((i) => i.name.toLowerCase()));
      const toAdd = allIngredients.filter((n) => !have.has(n.toLowerCase()));
      if (toAdd.length === 0) {
        toast.info("Shopping list already has all ingredients");
        return 0;
      }
      const { error } = await supabase.from("shopping_items").insert(
        toAdd.map((name) => ({
          family_id: familyId,
          name,
          category: "Pantry",
          ai_suggested: true,
          added_by: userId,
        })),
      );
      if (error) throw error;
      return toAdd.length;
    },
    onSuccess: (count) => {
      if (count) toast.success(`Added ${count} items to shopping list`);
      invalidateShopping();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePref = (p: string) =>
    setPrefs((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const startEdit = (date: string, slot: Slot) => {
    const m = mealAt(date, slot);
    setEditing({ date, slot });
    setTitle(m?.title ?? "");
    setIngredients(m?.ingredients.join(", ") ?? "");
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan the week and auto-generate your shopping list.
          </p>
        </div>
        <button
          onClick={() => generateShopping.mutate()}
          disabled={generateShopping.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-brand transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {generateShopping.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBasket className="size-4" />}
          Generate Shopping List
        </button>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ChefHat className="size-4 text-brand" /> Dietary preferences
        </div>
        <div className="flex flex-wrap gap-2">
          {DIETARY_PREFS.map((p) => {
            const on = prefs.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePref(p)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  on ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border bg-surface">
        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="size-5 animate-spin text-brand" /></div>
        ) : (
          <div className="grid min-w-[820px] grid-cols-[80px_repeat(7,1fr)]">
            <div className="border-b border-border bg-canvas/60 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slot</div>
            {weekDates.map((d, i) => (
              <div key={d} className="border-b border-l border-border bg-canvas/60 p-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {DAY_LABELS[i]} <span className="text-muted-foreground/60">{d.slice(8)}</span>
              </div>
            ))}
            {SLOTS.map((slot) => (
              <div key={slot} className="contents">
                <div className="border-b border-border p-3 text-xs font-semibold capitalize text-foreground">{slot}</div>
                {weekDates.map((date) => {
                  const m = mealAt(date, slot);
                  return (
                    <div key={date + slot} className="min-h-[88px] border-b border-l border-border p-2">
                      {m ? (
                        <div className="group h-full rounded-lg bg-brand-soft/50 p-2 text-xs">
                          <div className="flex items-start justify-between gap-1">
                            <button onClick={() => startEdit(date, slot)} className="text-left font-semibold text-foreground hover:underline">
                              {m.title}
                            </button>
                            <button
                              onClick={() => removeMeal.mutate(m.id)}
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="Remove"
                            >
                              <X className="size-3 text-muted-foreground" />
                            </button>
                          </div>
                          {m.dietary_tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {m.dietary_tags.map((t) => (
                                <span key={t} className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(date, slot)}
                          className="grid h-full w-full place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                        >
                          <Plus className="size-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-brand" /> Recipe suggestions
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RECIPE_SUGGESTIONS.map((r) => (
            <div key={r.title} className="rounded-xl border border-border bg-canvas/50 p-4">
              <div className="font-semibold">{r.title}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {r.dietary_tags.map((t) => (
                  <span key={t} className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">{t}</span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{r.ingredients.join(", ")}</p>
              <button
                onClick={() =>
                  upsertMeal.mutate({
                    date: weekDates[6],
                    slot: "dinner",
                    title: r.title,
                    ingredients: r.ingredients,
                    dietary_tags: r.dietary_tags,
                  })
                }
                className="mt-3 w-full rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                Add to Sunday Dinner
              </button>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              upsertMeal.mutate({
                date: editing.date,
                slot: editing.slot,
                title: title.trim(),
                ingredients: ingredients.split(",").map((s) => s.trim()).filter(Boolean),
              });
            }}
            className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold capitalize">{editing.slot} · {editing.date}</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meal title"
              maxLength={120}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Ingredients, comma separated"
              rows={3}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={upsertMeal.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
              >
                {upsertMeal.isPending && <Loader2 className="size-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
