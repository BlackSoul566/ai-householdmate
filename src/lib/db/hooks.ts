import { useQuery } from "@tanstack/react-query";
import { currentFamilyQuery } from "./queries";

export function useCurrentFamily() {
  return useQuery(currentFamilyQuery);
}
