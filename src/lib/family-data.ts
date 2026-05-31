export type MemberKey = "mom" | "dad" | "sarah" | "jake";

export interface FamilyMember {
  key: MemberKey;
  name: string;
  initial: string;
  colorVar: string;
  role: string;
}

export const FAMILY: FamilyMember[] = [
  { key: "mom", name: "Emma", initial: "E", colorVar: "var(--member-mom)", role: "Mom" },
  { key: "dad", name: "David", initial: "D", colorVar: "var(--member-dad)", role: "Dad" },
  { key: "sarah", name: "Sarah", initial: "S", colorVar: "var(--member-sarah)", role: "Daughter" },
  { key: "jake", name: "Jake", initial: "J", colorVar: "var(--member-jake)", role: "Son" },
];

export const memberByKey = (key: MemberKey) =>
  FAMILY.find((m) => m.key === key) ?? FAMILY[0];

export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  member: MemberKey;
}

export const TODAY_SCHEDULE: ScheduleEvent[] = [
  { id: "e1", time: "09:00", title: "School Drop-off", detail: "Both kids • 15 min", member: "mom" },
  { id: "e2", time: "12:30", title: "Lunch Meeting", detail: "David • Downtown", member: "dad" },
  { id: "e3", time: "16:00", title: "Piano Lesson", detail: "Sarah • Conservatory Hall", member: "sarah" },
  { id: "e4", time: "17:30", title: "Soccer Practice", detail: "Jake • Field 3", member: "jake" },
  { id: "e5", time: "18:30", title: "Grocery Pick-up", detail: "Whole Foods Market", member: "dad" },
  { id: "e6", time: "19:30", title: "Family Dinner", detail: "Taco Tuesday Night", member: "mom" },
];

export interface Chore {
  id: string;
  title: string;
  assignee: MemberKey;
  points: number;
  done: boolean;
}

export const INITIAL_CHORES: Chore[] = [
  { id: "c1", title: "Empty Dishwasher", assignee: "jake", points: 10, done: false },
  { id: "c2", title: "Walk the Dog", assignee: "sarah", points: 15, done: true },
  { id: "c3", title: "Fold Laundry", assignee: "mom", points: 25, done: false },
  { id: "c4", title: "Take Out Trash", assignee: "dad", points: 10, done: false },
  { id: "c5", title: "Water Plants", assignee: "sarah", points: 5, done: true },
  { id: "c6", title: "Vacuum Living Room", assignee: "jake", points: 20, done: false },
];

export type ShoppingCategory = "Produce" | "Dairy" | "Household" | "Bakery" | "Pantry" | "Meat" | "Frozen";

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  done: boolean;
  aiSuggested?: boolean;
}

export const INITIAL_SHOPPING: ShoppingItem[] = [
  { id: "s1", name: "Organic Oat Milk", category: "Dairy", done: false },
  { id: "s2", name: "Hass Avocados (3x)", category: "Produce", done: false },
  { id: "s3", name: "Sourdough Bread", category: "Bakery", done: false },
  { id: "s4", name: "Paper Towels", category: "Household", done: false, aiSuggested: true },
  { id: "s5", name: "Greek Yogurt", category: "Dairy", done: true },
  { id: "s6", name: "Baby Spinach", category: "Produce", done: false },
  { id: "s7", name: "Olive Oil", category: "Pantry", done: false, aiSuggested: true },
];

export interface Birthday {
  id: string;
  name: string;
  date: string;
  inDays: number;
}

export const BIRTHDAYS: Birthday[] = [
  { id: "b1", name: "Grandma Rose", date: "March 12", inDays: 3 },
  { id: "b2", name: "Uncle Mike", date: "March 24", inDays: 15 },
];

/* ---------- Meal Planner ---------- */

export type MealSlot = "Breakfast" | "Lunch" | "Dinner";
export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SLOTS: MealSlot[] = ["Breakfast", "Lunch", "Dinner"];

export interface Meal {
  id: string;
  day: DayKey;
  slot: MealSlot;
  name: string;
  tags: string[]; // dietary
  ingredients: string[];
}

export const INITIAL_MEALS: Meal[] = [
  { id: "m1", day: "Mon", slot: "Breakfast", name: "Greek Yogurt Parfait", tags: ["Vegetarian"], ingredients: ["Greek Yogurt", "Granola", "Berries", "Honey"] },
  { id: "m2", day: "Mon", slot: "Lunch", name: "Chicken Caesar Wrap", tags: [], ingredients: ["Tortilla", "Chicken Breast", "Romaine", "Parmesan"] },
  { id: "m3", day: "Mon", slot: "Dinner", name: "Sheet-Pan Salmon", tags: ["Gluten-free", "Pescatarian"], ingredients: ["Salmon", "Broccoli", "Lemon", "Olive Oil"] },
  { id: "m4", day: "Tue", slot: "Dinner", name: "Taco Tuesday", tags: [], ingredients: ["Ground Beef", "Taco Shells", "Cheddar", "Salsa", "Lettuce"] },
  { id: "m5", day: "Wed", slot: "Dinner", name: "Veggie Pasta Primavera", tags: ["Vegetarian"], ingredients: ["Pasta", "Zucchini", "Cherry Tomatoes", "Parmesan", "Garlic"] },
  { id: "m6", day: "Thu", slot: "Dinner", name: "Thai Green Curry", tags: ["Gluten-free"], ingredients: ["Chicken Thighs", "Coconut Milk", "Green Curry Paste", "Jasmine Rice", "Bell Pepper"] },
  { id: "m7", day: "Fri", slot: "Dinner", name: "Homemade Pizza Night", tags: [], ingredients: ["Pizza Dough", "Mozzarella", "Tomato Sauce", "Pepperoni"] },
  { id: "m8", day: "Sat", slot: "Breakfast", name: "Buttermilk Pancakes", tags: ["Vegetarian"], ingredients: ["Flour", "Buttermilk", "Eggs", "Maple Syrup"] },
  { id: "m9", day: "Sun", slot: "Dinner", name: "Roast Chicken & Veg", tags: ["Gluten-free"], ingredients: ["Whole Chicken", "Potatoes", "Carrots", "Rosemary"] },
];

export const RECIPE_SUGGESTIONS: { name: string; tags: string[]; ingredients: string[] }[] = [
  { name: "Mediterranean Bowl", tags: ["Vegetarian"], ingredients: ["Quinoa", "Chickpeas", "Cucumber", "Feta", "Olive Oil"] },
  { name: "Beef Stir Fry", tags: [], ingredients: ["Flank Steak", "Bell Pepper", "Soy Sauce", "Ginger", "Rice"] },
  { name: "Lentil Soup", tags: ["Vegan", "Gluten-free"], ingredients: ["Lentils", "Carrots", "Celery", "Onion", "Cumin"] },
  { name: "Shrimp Tacos", tags: ["Pescatarian"], ingredients: ["Shrimp", "Tortillas", "Cabbage Slaw", "Lime", "Avocado"] },
];

export const DIETARY_PREFS = ["Vegetarian", "Vegan", "Gluten-free", "Pescatarian", "Dairy-free"];

/* ---------- Goals & Habits ---------- */

export type GoalKind = "family" | "individual";
export interface Goal {
  id: string;
  title: string;
  kind: GoalKind;
  owner?: MemberKey;
  current: number;
  target: number;
  unit: string;
  streak?: number;
  emoji: string;
}

export const INITIAL_GOALS: Goal[] = [
  { id: "g1", title: "Save for Italy Vacation", kind: "family", current: 320, target: 500, unit: "€", emoji: "🏖️" },
  { id: "g2", title: "Read 10 Books This Year", kind: "individual", owner: "sarah", current: 4, target: 10, unit: "books", emoji: "📚" },
  { id: "g3", title: "Exercise 3x / Week", kind: "individual", owner: "dad", current: 2, target: 3, unit: "sessions", streak: 5, emoji: "💪" },
  { id: "g4", title: "Family Game Nights", kind: "family", current: 6, target: 12, unit: "nights", emoji: "🎲" },
  { id: "g5", title: "Daily Meditation", kind: "individual", owner: "mom", current: 18, target: 30, unit: "days", streak: 12, emoji: "🧘" },
  { id: "g6", title: "Soccer Goals Scored", kind: "individual", owner: "jake", current: 7, target: 15, unit: "goals", emoji: "⚽" },
];

/* ---------- Notifications ---------- */

export type NotifKind = "event" | "chore" | "shopping" | "goal";
export interface Notification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export const INITIAL_NOTIFS: Notification[] = [
  { id: "n1", kind: "event", title: "Piano lesson at 4 PM", body: "Sarah • Conservatory Hall", time: "in 2h", unread: true },
  { id: "n2", kind: "chore", title: "Overdue: Take Out Trash", body: "David — was due yesterday", time: "1d ago", unread: true },
  { id: "n3", kind: "shopping", title: "Don't forget grocery pick-up", body: "Whole Foods • 6:30 PM", time: "in 5h", unread: true },
  { id: "n4", kind: "goal", title: "Milestone reached 🎉", body: "Italy Vacation fund passed 60%!", time: "Today", unread: false },
  { id: "n5", kind: "event", title: "Grandma Rose's birthday", body: "In 3 days — March 12", time: "3d", unread: false },
];
