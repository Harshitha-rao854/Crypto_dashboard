import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchCoinDetails, fetchCoinProfile } from "../services/api";

const DETAILS_TIMEOUT_MS = 9000;
const DETAILS_RETRY_ATTEMPTS = 2;
const MARKETS_CACHE_KEY_PREFIX = "coins_cache_";
const DETAILS_CACHE_VERSION = "v2";
const PROFILE_CACHE_VERSION = "v1";

function getDetailsCacheKey(coinId, vsCurrency, days) {
  return `coin_details_${DETAILS_CACHE_VERSION}_${coinId}_${String(vsCurrency || "usd").toLowerCase()}_${days}`;
}

function getProfileCacheKey(coinId) {
  return `coin_profile_${PROFILE_CACHE_VERSION}_${coinId}`;
}

function readCachedProfile(coinId) {
  try {
    const raw = localStorage.getItem(getProfileCacheKey(coinId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedProfile(coinId, details) {
  try {
    if (!details?.id || !details?.name) return;
    const profile = {
      id: details.id,
      name: details.name,
      symbol: details.symbol || "",
      image: details.image || "",
      description: details.description || "",
      links: {
        homepage: details.links?.homepage || "",
        blockchain_site: Array.isArray(details.links?.blockchain_site)
          ? details.links.blockchain_site
          : [],
      },
    };
    localStorage.setItem(getProfileCacheKey(coinId), JSON.stringify(profile));
  } catch {
    // Ignore profile cache write failures.
  }
}

function readCachedDetails(cacheKey) {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.details || !parsed?.chart) return null;
    const pricePoints = Array.isArray(parsed?.chart?.prices) ? parsed.chart.prices.length : 0;
    if (pricePoints > 0 && !Number.isFinite(Number(parsed?.meta?.days))) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readMarketSnapshot(coinId, vsCurrency, days = 7) {
  try {
    const key = `${MARKETS_CACHE_KEY_PREFIX}${String(vsCurrency || "usd").toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const coin = parsed.find((item) => item?.id === coinId);
    if (!coin) return null;
    const sparklineRaw = Array.isArray(coin.sparkline_in_7d?.price)
      ? coin.sparkline_in_7d.price.filter((price) => Number.isFinite(price))
      : [];
    if (sparklineRaw.length < 2) return null;
    const sparkline = sparklineRaw;
    const safeDays = 7;
    const now = Date.now();
    const stepMs =
      sparkline.length > 1 ? Math.floor((safeDays * 24 * 60 * 60 * 1000) / sparkline.length) : 0;
    const prices = sparkline.map((price, index) => [
      now - (sparkline.length - 1 - index) * stepMs,
      Number(price),
    ]);
    const totalVolumes = prices.map(([ts, price]) => [ts, Number(price) * 1000]);

    const cachedProfile = readCachedProfile(coinId);

    return {
      details: {
        id: coin.id,
        name: cachedProfile?.name || coin.name,
        symbol: cachedProfile?.symbol || coin.symbol,
        image: cachedProfile?.image || coin.image,
        description: cachedProfile?.description || "",
        links: {
          homepage: cachedProfile?.links?.homepage || "",
          blockchain_site: cachedProfile?.links?.blockchain_site || [],
        },
        market_data: {
          current_price: { [String(vsCurrency || "usd").toLowerCase()]: coin.current_price },
          market_cap: { [String(vsCurrency || "usd").toLowerCase()]: coin.market_cap },
          price_change_percentage_24h: coin.price_change_percentage_24h,
        },
      },
      chart: { prices, total_volumes: [] },
      meta: {
        vs_currency: String(vsCurrency || "usd").toLowerCase(),
        source: "markets_snapshot",
        days: safeDays,
      },
    };
  } catch {
    return null;
  }
}

function movingAverage(values, windowSize = 8) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = values.slice(start, index + 1);
    const avg = slice.reduce((sum, item) => sum + item.price, 0) / slice.length;
    return Number(avg.toFixed(2));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(coinId, options) {
  return Promise.race([
    fetchCoinDetails(coinId, options),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("details_timeout")), DETAILS_TIMEOUT_MS);
    }),
  ]);
}

export default function CoinDetailsPage() {
  const navigate = useNavigate();
  const { coinId } = useParams();
  const [payload, setPayload] = useState(null);
  const [days, setDays] = useState(30);
  const vsCurrency = localStorage.getItem("vs_currency") || "usd";
  const [showPrice, setShowPrice] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showMa, setShowMa] = useState(true);
  const [retryTick, setRetryTick] = useState(0);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);
  const cacheKey = useMemo(
    () => getDetailsCacheKey(coinId, vsCurrency, days),
    [coinId, vsCurrency, days]
  );

  useEffect(() => {
    let active = true;
    setHasTriedLoad(false);
    const cached = readCachedDetails(cacheKey);
    const marketSnapshot = days === 7 ? readMarketSnapshot(coinId, vsCurrency, days) : null;
    const seedPayload = cached || marketSnapshot;
    if (seedPayload) {
      setPayload(seedPayload);
    } else {
      setPayload(null);
    }

    const load = async () => {
      for (let attempt = 0; attempt < DETAILS_RETRY_ATTEMPTS; attempt += 1) {
        try {
          const res = await fetchWithTimeout(coinId, { vsCurrency, days });
          if (!active) return;
          setPayload(res);
          localStorage.setItem(cacheKey, JSON.stringify(res));
          writeCachedProfile(coinId, res?.details);
          setHasTriedLoad(true);
          return;
        } catch {
          if (attempt < DETAILS_RETRY_ATTEMPTS - 1) {
            await sleep(500 * (attempt + 1));
            continue;
          }
          if (!active) return;
          setHasTriedLoad(true);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [cacheKey, coinId, vsCurrency, days, retryTick]);

  useEffect(() => {
    let active = true;
    const hasDescription = Boolean(payload?.details?.description?.trim());
    if (hasDescription) return () => {};

    fetchCoinProfile(coinId)
      .then((profile) => {
        if (!active || !profile) return;
        writeCachedProfile(coinId, profile);
        setPayload((prev) => {
          if (!prev?.details) return prev;
          return {
            ...prev,
            details: {
              ...prev.details,
              name: profile.name || prev.details.name,
              symbol: profile.symbol || prev.details.symbol,
              image: profile.image || prev.details.image,
              description: profile.description || prev.details.description || "",
              links: {
                homepage: profile.links?.homepage || prev.details.links?.homepage || "",
                blockchain_site:
                  profile.links?.blockchain_site || prev.details.links?.blockchain_site || [],
              },
            },
          };
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [coinId, payload?.details?.description]);

  const chartData = useMemo(() => {
    if (!payload?.chart?.prices?.length) return [];
    const base = payload.chart.prices.map((p, index) => ({
      time: new Date(p[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: Number(p[1].toFixed(2)),
      volume: Number((payload.chart.total_volumes?.[index]?.[1] || 0).toFixed(2)),
    }));
    const ma = movingAverage(base);
    return base.map((item, index) => ({ ...item, ma: ma[index] }));
  }, [payload]);
  const payloadDays = Number(payload?.meta?.days);
  const isSnapshotChart = payload?.meta?.source === "markets_snapshot";
  const isRangeMismatch =
    Number.isFinite(payloadDays) && Number.isFinite(Number(days)) && payloadDays !== Number(days);
  const hasChartData = chartData.length > 0 && !isRangeMismatch;
  const hasVolumeData = chartData.some((point) => Number(point.volume) > 0);
  const canRenderVolume = showVolume && !isSnapshotChart && hasVolumeData;
  const cleanDescription = (payload?.details?.description || "").replace(/<[^>]+>/g, "").trim();

  if (!payload) {
    return (
      <section className="mt-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/", { replace: true });
            }}
            className="inline-flex items-center gap-2 rounded border bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <span aria-hidden>←</span>
            Back
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {hasTriedLoad ? "Details unavailable for this coin right now." : "Loading coin details..."}
        </p>
        <button
          type="button"
          onClick={() => setRetryTick((v) => v + 1)}
          className="mt-3 rounded bg-indigo-600 px-3 py-1.5 text-xs text-white"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
      <div className="mb-3">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/", { replace: true });
          }}
          className="inline-flex items-center gap-2 rounded border bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          <span aria-hidden>←</span>
          Back
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <img src={payload.details.image} alt={payload.details.name} className="h-10 w-10" />
        <div>
          <h2 className="text-xl font-semibold">{payload.details.name}</h2>
          <p className="text-sm text-gray-500">{payload.details.symbol?.toUpperCase()}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs text-gray-500 dark:text-gray-300">Range</span>
        {[7, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded px-3 py-1 ${
              days === d
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
            }`}
          >
            {d === 7 ? "7D" : "30D"}
          </button>
        ))}
        <span className="ml-auto rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {String(vsCurrency).toUpperCase()}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        <button onClick={() => setShowPrice((s) => !s)} className="rounded bg-blue-600 px-3 py-1 text-white">Price</button>
        <button
          onClick={() => setShowVolume((s) => !s)}
          disabled={!hasVolumeData || isSnapshotChart}
          title={!hasVolumeData || isSnapshotChart ? "Volume data unavailable for this chart" : "Toggle volume"}
          className={`rounded px-3 py-1 text-white ${
            !hasVolumeData || isSnapshotChart ? "cursor-not-allowed bg-amber-700/60" : "bg-amber-600"
          }`}
        >
          Volume
        </button>
        <button onClick={() => setShowMa((s) => !s)} className="rounded bg-emerald-600 px-3 py-1 text-white">MA</button>
      </div>

      <div className="h-72">
        {hasChartData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="time" />
              <YAxis
                yAxisId="left"
                tickFormatter={(value) =>
                  `${String(vsCurrency).toUpperCase()} ${Number(value).toLocaleString()}`
                }
                label={{
                  value: `Price (${String(vsCurrency).toUpperCase()})`,
                  angle: -90,
                  position: "insideLeft",
                  offset: -2,
                  style: { fontSize: 11 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) =>
                  Number(value).toLocaleString("en-US", { notation: "compact" })
                }
                label={{
                  value: "Volume",
                  angle: 90,
                  position: "insideRight",
                  offset: 0,
                  style: { fontSize: 11 },
                }}
              />
              <Tooltip
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value, name) => {
                  const num = Number(value);
                  if (name === "volume") {
                    return [num.toLocaleString("en-US", { notation: "compact" }), "Volume"];
                  }
                  if (name === "ma") {
                    return [
                      `${String(vsCurrency).toUpperCase()} ${num.toLocaleString()}`,
                      "MA",
                    ];
                  }
                  return [
                    `${String(vsCurrency).toUpperCase()} ${num.toLocaleString()}`,
                    "Price",
                  ];
                }}
              />
              {canRenderVolume && (
                <Area
                  yAxisId="right"
                  dataKey="volume"
                  stroke="#f59e0b"
                  fill="#fcd34d"
                  fillOpacity={0.25}
                />
              )}
              {showPrice && (
                <Line yAxisId="left" dataKey="price" stroke="#2563eb" dot={false} strokeWidth={2} />
              )}
              {showMa && (
                <Line yAxisId="left" dataKey="ma" stroke="#10b981" dot={false} strokeDasharray="4 4" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-gray-500/40 text-center">
            <div>
              <p className="text-sm text-gray-300">Chart data is unavailable for this coin.</p>
              <button
                type="button"
                onClick={() => setRetryTick((v) => v + 1)}
                className="mt-3 rounded bg-indigo-600 px-3 py-1.5 text-xs text-white"
              >
                Retry chart
              </button>
            </div>
          </div>
        )}
      </div>

      {cleanDescription && (
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 line-clamp-6">{cleanDescription}</p>
      )}
      <div className="mt-3 text-sm">
        {payload.details.links.homepage && (
          <p>
            Website:{" "}
            <a className="text-blue-500 underline" href={payload.details.links.homepage} target="_blank" rel="noreferrer">
              {payload.details.links.homepage}
            </a>
          </p>
        )}
        {payload.details.links.blockchain_site?.[0] && (
          <p>
            Explorer:{" "}
            <a className="text-blue-500 underline" href={payload.details.links.blockchain_site[0]} target="_blank" rel="noreferrer">
              {payload.details.links.blockchain_site[0]}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
