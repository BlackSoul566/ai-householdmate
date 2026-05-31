import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import {
  INITIAL_SHOPPING,
  type ShoppingCategory,
  type ShoppingItem,
} from "@/lib/family-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "Shopping List — FamilyFlow AI" },
      {
        name: "description",
        content:
          "Shared grocery and household shopping list. AI suggests items based on your meal plans.",
      },
      { property: "og:title", content: "Shopping List — FamilyFlow AI" },
      {
        property: "og:description",
        content: "Shared family shopping lists with smart categorization and AI suggestions.",
      },
    ],
  }),
  component: ShoppingPage,
});

const CATEGORIES: ShoppingCategory[] = ["Produce", "Dairy", "Bakery", "Pantry", "Household"];

const CATEGORY_COLOR: Record<ShoppingCategory, string> = {
  Produce: "bg-green-500",
  Dairy: "bg-orange-400",
  Bakery: "bg-amber-500",
  Pantry: "bg-rose-400",
  Household: "bg-sky-500",
};

const AI_POOL = [
  "Eggs",
  "Pasta Sauce",
  "Honey",
  "Sparkling Water",
  "Dish Soap",
  "Bananas",
];

function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>(INITIAL_SHOPPING);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<ShoppingCategory>("Produce");

  const grouped = useMemo(() => {
    const map = new Map<ShoppingCategory, ShoppingItem[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const item of items) map.get(item.category)?.push(item);
    return map;
  }, [items]);

  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const aiCount = items.filter((i) => i.aiSuggested && !i.done).length;

  const toggle = (id: string) =>
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  const remove = (id: string) => setItems((arr) => arr.filter((i) => i.id !== id));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setItems((arr) => [
      ...arr,
      {
        id: `s${Date.now()}`,
        name: newName.trim(),
        category: newCategory,
        done: false,
      },
    ]);
    setNewName("");
  };

  const suggestMore = () => {
    const existing = new Set(items.map((i) => i.name));
    const next = AI_POOL.find((n) => !existing.has(n));
    if (!next) return;
    const guessCategory: ShoppingCategory =
      next === "Dish Soap"
        ? "Household"
        : next === "Bananas"
        ? "Produce"
        : next === "Eggs"
        ? "Dairy"
        : "Pantry";
    setItems((arr) => [
      ...arr,
      {
        id: `s${Date.now()}`,
        name: next,
        category: guessCategory,
        done: false,
        aiSuggested: true,
      },
    ]);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-sm text-muted-foreground">
            {done} of {total} items collected • {aiCount} AI suggestions waiting
          </p>
        </div>
        <button
          type="button"
          onClick={suggestMore}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-soft px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft/70"
        >
          <Sparkles className="size-4" />
          Suggest from meal plan
        </button>
      </header>

      {/* Add item form */}
      <form
        onSubmit={add}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-sm"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add an item to the family list…"
          className="flex-1 min-w-[180px] rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as ShoppingCategory)}
          className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-brand"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-brand transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Add
        </button>
      </form>

      {/* Categorized lists */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const list = grouped.get(cat) ?? [];
          if (list.length === 0) return null;
          return (
            <section
              key={cat}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2.5 rounded-full", CATEGORY_COLOR[cat])} />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">{list.length}</span>
              </div>

              <ul className="space-y-1.5">
                {list.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/60",
                      item.aiSuggested &&
                        !item.done &&
                        "border border-accent-soft bg-accent-soft/40",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded border text-[10px]",
                        item.done
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border bg-surface",
                      )}
                      aria-label={item.done ? "Mark not done" : "Mark done"}
                    >
                      {item.done ? "✓" : ""}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm font-medium",
                        item.done && "text-muted-foreground line-through",
                        item.aiSuggested && !item.done && "italic",
                      )}
                    >
                      {item.name}
                    </span>
                    {item.aiSuggested && !item.done && (
                      <span className="text-[10px] font-bold text-accent">AI</span>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove item"
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
    </div>
  );
}
