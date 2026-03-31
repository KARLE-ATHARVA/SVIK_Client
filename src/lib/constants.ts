// src/lib/constants.ts

const isDevelopment = process.env.NODE_ENV === "development";

function normalizeBase(raw?: string | null) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
}

function isAssetProxyPath(value?: string | null) {
  return normalizeBase(value).startsWith("/__asset_proxy__/");
}

export const CONCEPT_IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_CONCEPT_IMAGE_BASE_URL;

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

export const REMOTE_ASSET_BASE =
  normalizeBase(
    process.env.NEXT_PUBLIC_REMOTE_ASSET_BASE ||
      process.env.NEXT_PUBLIC_REMOTE_ASSET_BASE_URL ||
      process.env.NEXT_PUBLIC_ASSET_BASE ||
      process.env.NEXT_PUBLIC_ASSET_BASE_URL
  );

const configuredAssetBase = normalizeBase(
  process.env.NEXT_PUBLIC_ASSET_BASE || process.env.NEXT_PUBLIC_ASSET_BASE_URL
);

export const ASSET_BASE =
  !isDevelopment && isAssetProxyPath(configuredAssetBase)
    ? REMOTE_ASSET_BASE
    : configuredAssetBase || REMOTE_ASSET_BASE;
