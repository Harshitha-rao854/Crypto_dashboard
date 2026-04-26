import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#22c55e",
  "#eab308",
  "#3b82f6",
];

function formatCompact(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return num.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 });
}

export default function MarketVisuals({ coins, vsCurrency = "usd" }) {
  const currencyLabel = String(vsCurrency || "usd").toUpperCase();

  const dominanceData = useMemo(() => {
    const list = Array.isArray(coins) ? coins : [];
    const top = [...list]
      .filter((c) => Number.isFinite(c.market_cap) && c.market_cap > 0)
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 6);
    const totalTop = top.reduce((sum, c) => sum + c.market_cap, 0);
    const totalAll = list.reduce((sum, c) => sum + (Number(c.market_cap) || 0), 0);
    const other = Math.max(0, totalAll - totalTop);

    const rows = top.map((c) => ({
      name: c.symbol?.toUpperCase() || c.name,
      value: c.market_cap,
    }));
    if (other > 0) rows.push({ name: "Others", value: other });
    return { rows, totalAll };
  }, [coins]);

  const volumeData = useMemo(() => {
    const list = Array.isArray(coins) ? coins : [];
    return [...list]
      .filter((c) => Number.isFinite(c.total_volume) && c.total_volume > 0)
      .sort((a, b) => b.total_volume - a.total_volume)
      .slice(0, 10)
      .map((c) => ({
        name: c.symbol?.toUpperCase() || c.name,
        volume: c.total_volume,
      }));
  }, [coins]);

  if (!coins?.length) return null;

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <section className="rounded-lg bg-white p-4 shadow dark:bg-gray-900">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Market Dominance</h2>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {currencyLabel}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
          Based on market cap share (top 6 + others)
        </p>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dominanceData.rows}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                isAnimationActive
              >
                {dominanceData.rows.map((_entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${currencyLabel} ${formatCompact(value)}`}
                contentStyle={{ borderRadius: 10 }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow dark:bg-gray-900">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Volume Comparison</h2>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {currencyLabel}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">Top 10 by 24h volume</p>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => formatCompact(v)} />
              <Tooltip formatter={(value) => `${currencyLabel} ${formatCompact(value)}`} />
              <Bar dataKey="volume" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

