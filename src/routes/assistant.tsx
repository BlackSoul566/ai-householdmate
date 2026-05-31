import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — FamilyFlow AI" },
      { name: "description", content: "Chat with your AI family assistant about schedules, meals, and chores." },
    ],
  }),
  component: AssistantPage,
});

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "What's on everyone's schedule today?",
  "Plan meals for this week.",
  "Who still has unfinished chores?",
  "Create a shopping list for taco night.",
];

const SEED: Msg[] = [
  {
    id: "1",
    role: "assistant",
    text: "Hi! I'm your FamilyFlow assistant. I can help with schedules, meals, chores, and shopping. What can I do for you?",
  },
];

function mockReply(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("schedule") || p.includes("today"))
    return "Today: Emma is doing school drop-off at 9 AM, David has a lunch meeting at 12:30, Sarah has piano at 4 PM, Jake has soccer at 5:30 PM, and family dinner is at 7:30 PM (Taco Tuesday 🌮).";
  if (p.includes("meal") || p.includes("plan"))
    return "I drafted Mon–Sun dinners: Sheet-Pan Salmon, Tacos, Veggie Pasta, Thai Curry, Pizza Night, Roast Chicken, and leftovers. Want me to open the Meal Planner?";
  if (p.includes("chore"))
    return "Unfinished chores: Jake — Empty Dishwasher (10 pts), Mom — Fold Laundry (25 pts), Dad — Take Out Trash (10 pts, overdue), Jake — Vacuum Living Room (20 pts).";
  if (p.includes("shopping") || p.includes("taco"))
    return "Taco night list: Ground Beef, Taco Shells, Cheddar, Lettuce, Salsa, Sour Cream, Avocados, Lime. Added 8 items to your shopping list.";
  return "Got it — I'll work on that. (This is a demo assistant; connect Lovable AI to enable real responses.)";
}

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: mockReply(t) },
      ]);
      setThinking(false);
    }, 650);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col">
      <header className="mb-4 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent text-brand-foreground shadow-brand">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Family Assistant</h1>
          <p className="text-xs text-muted-foreground">Ask anything about your family's day</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-surface p-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
          >
            {m.role === "assistant" && (
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Bot className="size-4" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-brand text-brand-foreground"
                  : "bg-canvas text-foreground",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <Bot className="size-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-canvas px-4 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brand hover:text-brand"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2 rounded-2xl border border-border bg-surface p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about schedules, meals, chores…"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send className="size-4" />
          Send
        </button>
      </form>
    </div>
  );
}
