import axios from "axios";

const REQUEST_TIMEOUT_MS = 12000;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:4000/api"
    : "https://crypto-backend-0nmh.onrender.com/api");

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
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
  const currency = String(vsCurrency || "usd").toLowerCase();
  const safeDays = days || 30;

  try {

    const { data } = await api.get(`/coins/${coinId}/details`, {
      params: { vs_currency: currency, days: safeDays },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return data;
  } catch {
    
    const historyRes = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
      {
        params: { vs_currency: currency, days: safeDays },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    let details = {};
    try {
      const detailsRes = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}`,
        { timeout: REQUEST_TIMEOUT_MS }
      );

      details = {
        id: detailsRes.data.id,
        name: detailsRes.data.name,
        symbol: detailsRes.data.symbol,
        image: detailsRes.data.image?.large,
        description: detailsRes.data.description?.en || "",
        links: {
          homepage: detailsRes.data.links?.homepage?.[0] || "",
          blockchain_site:
            detailsRes.data.links?.blockchain_site?.filter(Boolean) || [],
        },
        market_data: detailsRes.data.market_data,
      };
    } catch {
      
      details = {
        id: coinId,
        name: coinId,
        symbol: coinId,
        image: "",
        description: "",
        links: { homepage: "", blockchain_site: [] },
        market_data: {},
      };
    }

    return {
      details,
      chart: historyRes.data, 
      meta: { vs_currency: currency, days: safeDays },
    };
  }
}
export async function fetchCoinProfile(coinId) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { data } = await api.get(`/coins/${coinId}/details`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return data?.details || null;
    } catch (error) {
      lastError = error;
      try {
        const { data } = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}`,
          { timeout: REQUEST_TIMEOUT_MS }
        );

        return {
          id: data.id,
          name: data.name,
          symbol: data.symbol,
          image: data.image?.large,
          description: data.description?.en || "",
          links: {
            homepage: data.links?.homepage?.[0] || "",
            blockchain_site: data.links?.blockchain_site?.filter(Boolean) || [],
          },
          market_data: data.market_data,
        };
      } catch (fallbackError) {
        lastError = fallbackError;
      }
    }

    await sleep(700 * (attempt + 1));
  }

  throw lastError;
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
