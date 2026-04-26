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
import { fetchCoinDetails } from "../services/api";

function movingAverage(values, windowSize = 8) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = values.slice(start, index + 1);
    const avg = slice.reduce((sum, item) => sum + item.price, 0) / slice.length;
    return Number(avg.toFixed(2));
  });
}

export default function CoinDetailsPage() {
  const navigate = useNavigate();
  const { coinId } = useParams();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const vsCurrency = localStorage.getItem("vs_currency") || "usd";
  const [showPrice, setShowPrice] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showMa, setShowMa] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCoinDetails(coinId, { vsCurrency, days })
      .then((res) => {
        if (!active) return;
        setPayload(res);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load coin details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [coinId, vsCurrency, days]);

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

  if (loading) return <p className="mt-4">Loading coin details...</p>;
  if (error) return <p className="mt-4 text-red-500">{error}</p>;
  if (!payload) return null;

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
        <button onClick={() => setShowVolume((s) => !s)} className="rounded bg-amber-600 px-3 py-1 text-white">Volume</button>
        <button onClick={() => setShowMa((s) => !s)} className="rounded bg-emerald-600 px-3 py-1 text-white">MA</button>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) =>
                `${String(vsCurrency).toUpperCase()} ${Number(value).toLocaleString()}`
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) =>
                `${String(vsCurrency).toUpperCase()} ${Number(value).toLocaleString()}`
              }
            />
            <Tooltip
              formatter={(value) =>
                `${String(vsCurrency).toUpperCase()} ${Number(value).toLocaleString()}`
              }
            />
            {showVolume && (
              <Area yAxisId="right" dataKey="volume" stroke="#f59e0b" fill="#fcd34d" fillOpacity={0.25} />
            )}
            {showPrice && <Line yAxisId="left" dataKey="price" stroke="#2563eb" dot={false} strokeWidth={2} />}
            {showMa && <Line yAxisId="left" dataKey="ma" stroke="#10b981" dot={false} strokeDasharray="4 4" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 line-clamp-6">
        {payload.details.description?.replace(/<[^>]+>/g, "") || "No description available."}
      </p>
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
