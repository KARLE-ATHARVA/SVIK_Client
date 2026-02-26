import { API_BASE } from "@/lib/constants";
import {
  buildQueryParams,
  type TileFilterRequest,
} from "@/lib/filterQuery";

export type TileFilterOptions = {
  categories: string[];
  applications: string[];
  finishes: string[];
  sizes: string[];
  colors: string[];
};

export type TileListItem = {
  tile_id: string | number;
  sku_name: string;
  sku_code: string;
  size_name?: string;
  [key: string]: unknown;
};

function resolveApiBase(): string {
  const apiBase = String(API_BASE ?? "").trim();
  if (!apiBase) {
    throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
  }
  return apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
}

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const deduped = new Set<string>();
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const normalized = value.trim();
    if (!normalized) return;
    deduped.add(normalized);
  });

  return Array.from(deduped);
}

async function getJson<T>(
  endpoint: string,
  request: TileFilterRequest,
  signal?: AbortSignal
): Promise<T> {
  const base = resolveApiBase();
  const query = buildQueryParams(request).toString();
  const response = await fetch(`${base}${endpoint}?${query}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`${endpoint} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchFilterOptions(
  spaceName: string,
  signal?: AbortSignal
): Promise<TileFilterOptions> {
  const raw = await getJson<Partial<TileFilterOptions>>(
    "FilterOptions",
    { spaceName },
    signal
  );

  return {
    categories: normalizeStringArray(raw?.categories),
    applications: normalizeStringArray(raw?.applications),
    finishes: normalizeStringArray(raw?.finishes),
    sizes: normalizeStringArray(raw?.sizes),
    colors: normalizeStringArray(raw?.colors),
  };
}

export async function fetchFilterAvailableOptions(
  request: TileFilterRequest,
  signal?: AbortSignal
): Promise<TileFilterOptions> {
  const raw = await getJson<Partial<TileFilterOptions>>(
    "FilterAvailableOptions",
    request,
    signal
  );

  return {
    categories: normalizeStringArray(raw?.categories),
    applications: normalizeStringArray(raw?.applications),
    finishes: normalizeStringArray(raw?.finishes),
    sizes: normalizeStringArray(raw?.sizes),
    colors: normalizeStringArray(raw?.colors),
  };
}

export async function fetchFilterTileList(
  request: TileFilterRequest,
  signal?: AbortSignal
): Promise<TileListItem[]> {
  const raw = await getJson<unknown>("FilterTileList", request, signal);

  if (Array.isArray(raw)) {
    return raw as TileListItem[];
  }

  return [];
}
