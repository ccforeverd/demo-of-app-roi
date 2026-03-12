import { useQuery } from "@tanstack/react-query";
import { fetchFilters, fetchRoiData } from "../lib/api";
import { useRoiStore } from "../store/useRoiStore";

export function useFilters() {
  return useQuery({
    queryKey: ["filters"],
    queryFn: fetchFilters,
  });
}

export function useRoiChartData() {
  const { app, country, bidType, installChannel } = useRoiStore();

  return useQuery({
    queryKey: ["roiData", app, country, bidType, installChannel],
    queryFn: () =>
      fetchRoiData({
        app: app || undefined,
        country: country || undefined,
        bid_type: bidType || undefined,
        install_channel: installChannel || undefined,
        predict: true,
      }),
    enabled: true,
  });
}
