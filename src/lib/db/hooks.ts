import { useQuery } from "@tanstack/react-query";
import { currentFamilyQuery } from "./queries";
import { useAuth } from "@/lib/auth";

export function useCurrentFamily() {
  return useQuery(currentFamilyQuery);
}

export function useFamilyContext() {
  const { user } = useAuth();
  const { data: family, isLoading } = useQuery(currentFamilyQuery);
  return {
    familyId: family?.id ?? null,
    userId: user?.id ?? null,
    family,
    isLoading,
  };
}
