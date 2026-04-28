import axios from "axios";

const cache = new Map();
const inFlight = new Map();
const TTL_MS = 10000;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error) {
  const status = error?.response?.status;
  if (!status) return true;
  return status === 429 || status >= 500;
}

async function requestWithRetry(url, config = {}) {
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await axios.get(url, { timeout: 12000, ...config });
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt === MAX_RETRIES - 1) break;

      const retryAfterHeader = Number(error?.response?.headers?.["retry-after"]);
      const retryAfterMs = Number.isFinite(retryAfterHeader) ? retryAfterHeader * 1000 : null;
      const backoffMs = retryAfterMs ?? 400 * 2 ** attempt + Math.floor(Math.random() * 250);
      await sleep(backoffMs);
    }
  }
  throw lastError;
}

async function fromCache(key, loader) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.time < TTL_MS) return hit.data;

  const running = inFlight.get(key);
  if (running) return running;

  const loadPromise = loader()
    .then((data) => {
      cache.set(key, { time: Date.now(), data });
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, loadPromise);
  return loadPromise;
}

export async function getMarkets() {
  return fromCache("markets-usd", async () => {
    const res = await requestWithRetry("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: 50,
        page: 1,
        sparkline: true,
      },
    });
    return res.data;
  });
}

export async function getCoinDetails(coinId) {
  return fromCache(`coin-${coinId}`, async () => {
    const [details, history] = await Promise.all([
      requestWithRetry(`https://api.coingecko.com/api/v3/coins/${coinId}`),
      requestWithRetry(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
        params: { vs_currency: "usd", days: 30 },
      }),
    ]);

    return {
      details: {
        id: details.data.id,
        name: details.data.name,
        symbol: details.data.symbol,
        image: details.data.image?.large,
        description: details.data.description?.en || "",
        links: {
          homepage: details.data.links?.homepage?.[0] || "",
          blockchain_site: details.data.links?.blockchain_site?.filter(Boolean) || [],
        },
        market_data: details.data.market_data,
      },
      chart: history.data,
    };
  });
}

export async function getMarketsByCurrency(vsCurrency = "usd") {
  const currency = String(vsCurrency || "usd").toLowerCase();
  return fromCache(`markets-${currency}`, async () => {
    const res = await requestWithRetry("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: currency,
        order: "market_cap_desc",
        per_page: 50,
        page: 1,
        sparkline: true,
      },
    });
    return res.data;
  });
}

export async function getCoinDetailsByCurrency(coinId, vsCurrency = "usd", days = 30) {
  const currency = String(vsCurrency || "usd").toLowerCase();
  const parsedDays = Number(days);
  const safeDays = Number.isFinite(parsedDays) ? Math.min(365, Math.max(1, parsedDays)) : 30;

  return fromCache(`coin-${coinId}-${currency}-${safeDays}`, async () => {
    const [details, history] = await Promise.all([
      requestWithRetry(`https://api.coingecko.com/api/v3/coins/${coinId}`),
      requestWithRetry(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
        params: { vs_currency: currency, days: safeDays },
      }),
    ]);

    return {
      details: {
        id: details.data.id,
        name: details.data.name,
        symbol: details.data.symbol,
        image: details.data.image?.large,
        description: details.data.description?.en || "",
        links: {
          homepage: details.data.links?.homepage?.[0] || "",
          blockchain_site: details.data.links?.blockchain_site?.filter(Boolean) || [],
        },
        market_data: details.data.market_data,
      },
      chart: history.data,
      meta: { vs_currency: currency, days: safeDays },
    };
  });
}
