import type {
  ApiResponse,
  FilterOptions,
  ImportResult,
  RoiDataPoint,
  RoiQueryParams,
} from "@demo-of-app-roi/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function buildApiUrl(path: string, apiBase = API_BASE): string {
  const base = apiBase.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${base}${normalizedPath.slice(4)}`;
  }

  return `${base}${normalizedPath}`;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(buildApiUrl(path));
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  const body: ApiResponse<T> = await res.json();
  if (!body.success) throw new Error(body.error ?? "Unknown error");
  return body.data as T;
}

export function fetchFilters(): Promise<FilterOptions> {
  return fetchApi<FilterOptions>("/api/roi/filters");
}

export async function uploadCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(buildApiUrl("/api/roi/import"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  const body: ApiResponse<ImportResult> = await res.json();
  if (!body.success) throw new Error(body.error ?? "Unknown error");
  return body.data as ImportResult;
}

export async function clearData(): Promise<{ deleted_rows: number }> {
  const res = await fetch(buildApiUrl("/api/roi/clear"), { method: "DELETE" });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  const body: ApiResponse<{ deleted_rows: number }> = await res.json();
  if (!body.success) throw new Error(body.error ?? "Unknown error");
  return body.data as { deleted_rows: number };
}

export function fetchRoiData(
  params: RoiQueryParams & { predict?: boolean },
): Promise<RoiDataPoint[]> {
  const searchParams = new URLSearchParams();
  if (params.app) searchParams.set("app", params.app);
  if (params.country) searchParams.set("country", params.country);
  if (params.bid_type) searchParams.set("bid_type", params.bid_type);
  if (params.install_channel)
    searchParams.set("install_channel", params.install_channel);
  if (params.start_date) searchParams.set("start_date", params.start_date);
  if (params.end_date) searchParams.set("end_date", params.end_date);
  if (params.predict) searchParams.set("predict", "true");

  const qs = searchParams.toString();
  return fetchApi<RoiDataPoint[]>(`/api/roi/data${qs ? `?${qs}` : ""}`);
}
