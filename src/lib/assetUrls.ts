import { ASSET_BASE, REMOTE_ASSET_BASE } from "@/lib/constants";

function normalizeBase(raw?: string | null): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
}

function readWindowValue(key: string): string {
  if (typeof window === "undefined") return "";
  const scopedWindow = window as Window & Record<string, unknown>;
  return normalizeBase(String(scopedWindow[key] ?? "").trim());
}

function readStorageValue(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return normalizeBase(localStorage.getItem(key));
  } catch {
    return "";
  }
}

export function getAssetBase(): string {
  return (
    readWindowValue("VISUALIZER_ASSET_BASE") ||
    readStorageValue("visualizer_asset_base") ||
    readWindowValue("NEXT_PUBLIC_ASSET_BASE") ||
    normalizeBase(ASSET_BASE)
  );
}

export function getRemoteAssetBase(): string {
  return (
    readWindowValue("NEXT_PUBLIC_REMOTE_ASSET_BASE") ||
    normalizeBase(REMOTE_ASSET_BASE) ||
    getAssetBase()
  );
}

export function resolveAssetUrl(raw?: string | null): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^data:/i.test(value)) return value;

  const assetBase = getAssetBase();
  const remoteAssetBase = getRemoteAssetBase();

  if (/^https?:\/\//i.test(value) || /^\/\//.test(value)) {
    if (
      assetBase &&
      remoteAssetBase &&
      assetBase !== remoteAssetBase &&
      value.startsWith(remoteAssetBase)
    ) {
      return `${assetBase}${value.slice(remoteAssetBase.length)}`;
    }
    return value;
  }

  if (value.startsWith("/app/") || value.startsWith("/images/")) {
    return value;
  }

  if (value.startsWith("/assets/")) {
    return assetBase ? `${assetBase}${value.slice("/assets/".length)}` : value;
  }

  if (value.startsWith("/")) {
    return value;
  }

  const cleaned = value.replace(/^\.?\//, "").replace(/^assets\//, "");
  return assetBase ? `${assetBase}${cleaned}` : `/${cleaned}`;
}

export function buildAssetUrl(path: string): string {
  const cleaned = String(path || "").replace(/^\/+/, "");
  return resolveAssetUrl(cleaned);
}
