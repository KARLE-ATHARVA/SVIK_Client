export type MultiValueFilterKey =
  | "catNames"
  | "appNames"
  | "sizeNames"
  | "finishNames"
  | "colorNames";

export type TileFilterSelections = Record<MultiValueFilterKey, string[]>;

export type TileFilterRequest = Partial<TileFilterSelections> & {
  spaceName: string;
};

const MULTI_VALUE_KEYS: MultiValueFilterKey[] = [
  "catNames",
  "appNames",
  "sizeNames",
  "finishNames",
  "colorNames",
];

function normalizeMultiValues(values?: string[] | null): string[] {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const deduped = new Set<string>();
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const normalized = value.trim();
    if (!normalized) return;
    deduped.add(normalized);
  });

  return Array.from(deduped);
}

export function sanitizeFilterSelections(
  filters: Partial<TileFilterSelections>
): TileFilterSelections {
  return {
    catNames: normalizeMultiValues(filters.catNames),
    appNames: normalizeMultiValues(filters.appNames),
    sizeNames: normalizeMultiValues(filters.sizeNames),
    finishNames: normalizeMultiValues(filters.finishNames),
    colorNames: normalizeMultiValues(filters.colorNames),
  };
}

export function buildQueryParams(request: TileFilterRequest): URLSearchParams {
  const spaceName = typeof request.spaceName === "string" ? request.spaceName.trim() : "";
  if (!spaceName) {
    throw new Error("spaceName is required.");
  }

  const params = new URLSearchParams();
  params.set("spaceName", spaceName);

  MULTI_VALUE_KEYS.forEach((key) => {
    const normalizedValues = normalizeMultiValues(request[key]);
    if (normalizedValues.length > 0) {
      params.set(key, normalizedValues.join(","));
    }
  });

  return params;
}

export function buildFilterRequestKey(request: TileFilterRequest): string {
  return buildQueryParams(request).toString();
}
