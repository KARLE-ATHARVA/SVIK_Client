import axios from "axios";
import { getToken } from "./auth";
import { API_BASE } from "./constants"; // Use your shared constant instead

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const addFavoriteAPI = (tileId: string | number) =>
  axios.post(`${API_BASE}/add_fav/${tileId}`, {}, authHeader());

export const removeFavoriteAPI = (tileId: string | number) =>
  axios.delete(`${API_BASE}/remove_fav/${tileId}`, authHeader());

export const listFavoritesAPI = () =>
  axios.get(`${API_BASE}/list_fav`, authHeader());