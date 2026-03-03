import { API_BASE } from "@/lib/constants";
import { getToken } from "@/lib/auth";

export const CART_UPDATED_EVENT = "cart:updated";

export type CartItem = {
  tile_id: number;
  sku_name: string;
  sku_code: string;
  quantity: number;
};

function resolveApiBase(): string {
  const base = String(API_BASE ?? "").trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE is missing");
  }
  return base.endsWith("/") ? base : `${base}/`;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) {
    throw new Error("Please login to continue");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Request failed (${res.status})`);
  }
  return (await res.json().catch(() => null)) as T;
}

export function emitCartUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

export async function addToCartAPI(tileId: number, quantity = 1): Promise<string | null> {
  const url = `${resolveApiBase()}cartadd/${tileId}?quantity=${quantity}`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Add to cart failed (${res.status})`);
  }
  emitCartUpdated();
  return res.text().catch(() => null);
}

export async function listCartAPI(): Promise<CartItem[]> {
  const url = `${resolveApiBase()}cartlist`;
  const res = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseResponse<CartItem[] | null>(res);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item) => ({
    tile_id: Number(item.tile_id ?? 0),
    sku_name: String(item.sku_name ?? "").trim(),
    sku_code: String(item.sku_code ?? "").trim(),
    quantity: Number(item.quantity ?? 0),
  }));
}

export async function updateCartQuantityAPI(tileId: number, quantity: number): Promise<string | null> {
  const url = `${resolveApiBase()}cartupdate/${tileId}?quantity=${quantity}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Update cart failed (${res.status})`);
  }
  emitCartUpdated();
  return res.text().catch(() => null);
}

export async function removeFromCartAPI(tileId: number): Promise<string | null> {
  const url = `${resolveApiBase()}cartremove/${tileId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Remove from cart failed (${res.status})`);
  }
  emitCartUpdated();
  return res.text().catch(() => null);
}
