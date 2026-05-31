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

export type ShoppingCategory = "Produce" | "Dairy" | "Household" | "Bakery" | "Pantry";

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
