import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchMarkets } from "../services/api";

const CACHE_KEY = "coins_cache";
const POLL_INTERVAL_MS = 10000;

export default function useCryptoData({ vsCurrency = "usd" } = {}) {
  const [data, setData] = useState([]);
  const [previousData, setPreviousData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const cacheKey = useMemo(
    () => `${CACHE_KEY}_${String(vsCurrency || "usd").toLowerCase()}`,
    [vsCurrency]
  );

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);

    try {
      const coinGeckoRes = await fetchMarkets({ vsCurrency });
      setData((prev) => {
        setPreviousData(prev);
        return coinGeckoRes;
      });
      localStorage.setItem(cacheKey, JSON.stringify(coinGeckoRes));
      setLastUpdated(new Date().toISOString());
      setError("");
    } catch {
      try {
        // Frontend fallback when local backend is not running.
        const currency = String(vsCurrency || "usd").toLowerCase();
        const fallback = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: currency,
              order: "market_cap_desc",
              per_page: 50,
              page: 1,
              sparkline: true,
            },
          }
        );
        setData((prev) => {
          setPreviousData(prev);
          return fallback.data;
        });
        localStorage.setItem(cacheKey, JSON.stringify(fallback.data));
        setLastUpdated(new Date().toISOString());
        setError("Backend unavailable. Showing direct market feed.");
      } catch {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLastUpdated(new Date().toISOString());
          setError("Live data unavailable. Showing last cached data.");
        } else {
          setData([]);
          setError("Unable to load coin data. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, vsCurrency]);

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchData(true), 0);
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchData(false);
    }, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [fetchData]);

  return {
    data,
    previousData,
    loading,
    error,
    lastUpdated,
    retry: () => fetchData(true),
  };
}