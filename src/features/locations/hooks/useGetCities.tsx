import { useQuery } from "@tanstack/react-query";
import { GetCities } from "../services";
import { CACHE_TIMING } from "@/config/constants";
import { QUERY_KEYS } from "@/config/queryKeys";

export function useGetCities(regionCode?: string, provinceCode?: string) {
  const queryKey = provinceCode
    ? QUERY_KEYS.locations.citiesByProvince(provinceCode)
    : QUERY_KEYS.locations.citiesByRegion(regionCode || "");

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (provinceCode) {
        return GetCities(undefined, provinceCode, {
          handlerName: "useCities",
          stepName: "Fetch Cities by Province",
        });
      }

      return GetCities(regionCode, undefined, {
        handlerName: "useCities",
        stepName: "Fetch Cities by Region",
      });
    },
    enabled: Boolean(provinceCode || regionCode),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}
