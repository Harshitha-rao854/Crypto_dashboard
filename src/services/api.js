import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function signup(username, password) {
  const { data } = await api.post("/auth/signup", { username, password });
  return data;
}

export async function login(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
}

export async function fetchMarkets({ vsCurrency } = {}) {
  const { data } = await api.get("/coins/markets", {
    params: vsCurrency ? { vs_currency: vsCurrency } : undefined,
  });
  return data;
}

export async function fetchCoinDetails(coinId, { vsCurrency, days } = {}) {
  const params = {};
  if (vsCurrency) params.vs_currency = vsCurrency;
  if (days) params.days = days;

  const { data } = await api.get(`/coins/${coinId}/details`, {
    params: Object.keys(params).length ? params : undefined,
  });
  return data;
}

export async function fetchWatchlist() {
  const { data } = await api.get("/watchlist");
  return data;
}

export async function saveWatchlist(coinIds) {
  const { data } = await api.put("/watchlist", { coinIds });
  return data;
}

export async function fetchPortfolio() {
  const { data } = await api.get("/portfolio");
  return data;
}

export async function savePortfolio(holdings) {
  const { data } = await api.put("/portfolio", { holdings });
  return data;
}
