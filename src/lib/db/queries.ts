import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Family = Tables<"families">;
export type FamilyMember = Tables<"family_members">;
export type FamilyInvite = Tables<"family_invites">;
export type EventRow = Tables<"events">;
export type ChoreRow = Tables<"chores">;
export type ShoppingRow = Tables<"shopping_items">;
export type MealRow = Tables<"meals">;
export type GoalRow = Tables<"goals">;
export type NotificationRow = Tables<"notifications">;

async function fetchCurrentFamilyId(): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("user_families")
    .select("family_id, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const owner = data.find((r) => r.role === "owner");
  return (owner ?? data[0]).family_id;
}

export const currentFamilyQuery = queryOptions({
  queryKey: ["current-family"],
  queryFn: async () => {
    const familyId = await fetchCurrentFamilyId();
    if (!familyId) return null;
    const { data: family } = await supabase
      .from("families")
      .select("*")
      .eq("id", familyId)
      .maybeSingle();
    return family;
  },
  staleTime: 60_000,
});

export const membersQuery = (familyId: string) =>
  queryOptions({
    queryKey: ["members", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
  });

export const eventsQuery = (familyId: string) =>
  queryOptions({
    queryKey: ["events", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("family_id", familyId)
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
  });

export const choresQuery = (familyId: string) =>
  queryOptions({
    queryKey: ["chores", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chores")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
  });

export const shoppingQuery = (familyId: string) =>
  queryOptions({
    queryKey: ["shopping", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
  });

export const mealsQuery = (familyId: string) =>
  queryOptions({
    queryKey: ["meals", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("family_id", familyId)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
  });

export const goalsQuery = (familyId: string) =>
  queryOptions({
    queryKey: ["goals", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
  });

export const notificationsQuery = (familyId: string) =>
  queryOptions({
    queryKey: ["notifications", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
  });

export const invitesQuery = (familyId: string) =>
  queryOptions({
    queryKey: ["invites", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_invites")
        .select("*")
        .eq("family_id", familyId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
  });

export function useFamilyId(): string | null {
  // Helper to read cached family id without firing a query
  return null;
}
