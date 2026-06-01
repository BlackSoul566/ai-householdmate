import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChefHat, Sparkles, ShoppingBasket, Plus, X } from "lucide-react";
import {
  DAYS,
  SLOTS,
  INITIAL_MEALS,
  RECIPE_SUGGESTIONS,
  DIETARY_PREFS,
  type DayKey,
  type Meal,
  type MealSlot,
} from "@/lib/family-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meals")({
  head: () => ({
    meta: [
      { title: "Meal Planner — FamilyFlow AI" },
      { name: "description", content: "Plan family meals for the week with AI-powered recipe suggestions." },
    ],
  }),
  component: MealsPage,
});

function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [prefs, setPrefs] = useState<string[]>(["Vegetarian"]);
  const [generated, setGenerated] = useState<string[]>([]);

  const mealAt = (day: DayKey, slot: MealSlot) =>
    meals.find((m) => m.day === day && m.slot === slot);

  const togglePref = (p: string) =>
    setPrefs((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const removeMeal = (id: string) => setMeals((m) => m.filter((x) => x.id !== id));

  const addSuggestion = (idx: number, day: DayKey, slot: MealSlot) => {
    const r = RECIPE_SUGGESTIONS[idx];
    setMeals((m) => [
      ...m.filter((x) => !(x.day === day && x.slot === slot)),
      { id: crypto.randomUUID(), day, slot, ...r },
    ]);
  };

  const groceryList = useMemo(() => {
    const set = new Set<string>();
    meals.forEach((m) => m.ingredients.forEach((i) => set.add(i)));
    return Array.from(set).sort();
  }, [meals]);

  const generate = () => setGenerated(groceryList);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan the week, get AI recipe ideas, and auto-generate your shopping list.
          </p>
        </div>
        <button
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-brand transition-opacity hover:opacity-90"
        >
          <ShoppingBasket className="size-4" />
          Generate Shopping List
        </button>
      </header>

      {/* Dietary prefs */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ChefHat className="size-4 text-brand" />
          Dietary preferences
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
                  on
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </section>

      {/* Weekly grid */}
      <section className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <div className="grid min-w-[820px] grid-cols-[80px_repeat(7,1fr)]">
          <div className="border-b border-border bg-canvas/60 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Slot
          </div>
          {DAYS.map((d) => (
            <div
              key={d}
              className="border-b border-l border-border bg-canvas/60 p-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {SLOTS.map((slot) => (
            <div key={slot} className="contents">
              <div className="border-b border-border p-3 text-xs font-semibold text-foreground">
                {slot}
              </div>
              {DAYS.map((day) => {
                const m = mealAt(day, slot);
                return (
                  <div
                    key={day + slot}
                    className="min-h-[88px] border-b border-l border-border p-2"
                  >
                    {m ? (
                      <div className="group h-full rounded-lg bg-brand-soft/50 p-2 text-xs">
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-foreground">{m.name}</span>
                          <button
                            onClick={() => removeMeal(m.id)}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Remove"
                          >
                            <X className="size-3 text-muted-foreground" />
                          </button>
                        </div>
                        {m.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {m.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button className="grid h-full w-full place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                        <Plus className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* AI Recipe suggestions */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-brand" />
          AI recipe suggestions
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RECIPE_SUGGESTIONS.map((r, i) => (
            <div key={r.name} className="rounded-xl border border-border bg-canvas/50 p-4">
              <div className="font-semibold">{r.name}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {r.tags.map((t) => (
                  <span key={t} className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {r.ingredients.join(", ")}
              </p>
              <button
                onClick={() => addSuggestion(i, "Sun", "Dinner")}
                className="mt-3 w-full rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                Add to Sunday Dinner
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Generated list */}
      {generated.length > 0 && (
        <section className="rounded-2xl border border-brand/30 bg-brand-soft/50 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
            <ShoppingBasket className="size-4" />
            Generated shopping list ({generated.length} items)
          </div>
          <div className="flex flex-wrap gap-2">
            {generated.map((g) => (
              <span key={g} className="rounded-full bg-surface px-3 py-1 text-xs">
                {g}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
