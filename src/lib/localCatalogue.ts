"use client";

export type LocalCatalogueItem = {
  skuCode: string;
  name: string;
  size: string;
  image: string;
};

const STORAGE_KEY = "local_catalogue_items";
export const CATALOGUE_UPDATED_EVENT = "catalogue:updated";

function safeParse(raw: string | null): LocalCatalogueItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readItems(): LocalCatalogueItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function writeItems(items: LocalCatalogueItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function emitCatalogueUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CATALOGUE_UPDATED_EVENT));
}

export function listCatalogueItems(): LocalCatalogueItem[] {
  return readItems();
}

export function isInCatalogue(skuCode: string): boolean {
  const key = String(skuCode || "").trim();
  if (!key) return false;
  return readItems().some((item) => item.skuCode === key);
}

export function addToCatalogue(item: LocalCatalogueItem): void {
  const key = String(item.skuCode || "").trim();
  if (!key) return;
  const items = readItems();
  if (items.some((it) => it.skuCode === key)) return;
  items.unshift({ ...item, skuCode: key });
  writeItems(items);
  emitCatalogueUpdated();
}

export function removeFromCatalogue(skuCode: string): void {
  const key = String(skuCode || "").trim();
  if (!key) return;
  const items = readItems().filter((item) => item.skuCode !== key);
  writeItems(items);
  emitCatalogueUpdated();
}
