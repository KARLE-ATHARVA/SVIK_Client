import axios from "axios";
import { getToken } from "./auth";
import { API_BASE } from "./constants"; // Use your shared constant instead

function resolveApiBase(): string {
  const apiBase = String(API_BASE ?? "").trim();
  if (!apiBase) throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
  return apiBase.replace(/\/+$/, "");
}

function buildApiUrl(pathname: string): string {
  const base = resolveApiBase();
  return new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, base).toString();
}

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const addFavoriteAPI = (tileId: string | number) =>
  axios.post(buildApiUrl(`/add_fav/${tileId}`), {}, authHeader());

export const removeFavoriteAPI = (tileId: string | number) =>
  axios.delete(buildApiUrl(`/remove_fav/${tileId}`), authHeader());

export const listFavoritesAPI = () =>
  axios.get(buildApiUrl("/list_fav"), authHeader());
