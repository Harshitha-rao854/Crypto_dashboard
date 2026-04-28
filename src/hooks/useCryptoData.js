import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { fetchMarkets } from "../services/api";

const CACHE_KEY = "coins_cache";
const POLL_INTERVAL_MS = 10000;
const REQUEST_TIMEOUT_MS = 8000;

export default function useCryptoData({ vsCurrency = "usd" } = {}) {
  const [data, setData] = useState([]);
  const [previousData, setPreviousData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const inFlightRef = useRef(false);

  const cacheKey = useMemo(
    () => `${CACHE_KEY}_${String(vsCurrency || "usd").toLowerCase()}`,
    [vsCurrency]
  );

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) {
      setData([]);
      setPreviousData([]);
      setLoading(true);
      return;
    }

    try {
      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) throw new Error("Invalid cache payload");
      setData(parsed);
      setPreviousData(parsed);
      setLoading(false);
      setError("");
      setLastUpdated(new Date().toISOString());
    } catch {
      localStorage.removeItem(cacheKey);
      setData([]);
      setPreviousData([]);
      setLoading(true);
    }
  }, [cacheKey]);

  const fetchData = useCallback(async (showLoading = false, force = false) => {
    if (inFlightRef.current && !force) return;
    inFlightRef.current = true;
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
            timeout: REQUEST_TIMEOUT_MS,
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
        // Fallback is still a valid live feed, so don't show an error state in UI.
        setError("");
      } catch {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (!Array.isArray(parsed)) throw new Error("Invalid cache payload");
            setData((prev) => {
              setPreviousData(prev);
              return parsed;
            });
            setLastUpdated(new Date().toISOString());
            // Cached data is a degraded mode, but not a blocking error for the page.
            setError("");
          } catch {
            localStorage.removeItem(cacheKey);
            setData([]);
            setError("Unable to load coin data. Please try again.");
          }
        } else {
          setData([]);
          setError("Unable to load coin data. Please try again.");
        }
      }
    } finally {
      inFlightRef.current = false;
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
    retry: () => fetchData(true, true),
  };
}