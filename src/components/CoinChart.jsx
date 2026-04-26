import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";

function movingAverage(values, windowSize = 8) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = values.slice(start, index + 1);
    const avg = slice.reduce((sum, item) => sum + item.price, 0) / slice.length;
    return Number(avg.toFixed(2));
  });
}

export default function CoinChart({ coinId, days, vsCurrency = "usd" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    axios
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${String(
          vsCurrency || "usd"
        ).toLowerCase()}&days=${days}`
      )
      .then((res) => {
        if (!isMounted) return;
        const prices = res.data.prices;
        const volumes = res.data.total_volumes || [];
        const base = prices.map((p, index) => ({
          time:
            days === 1
              ? new Date(p[0]).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : new Date(p[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          price: Number(p[1].toFixed(2)),
          volume: Number((volumes[index]?.[1] || 0).toFixed(2)),
        }));
        const ma = movingAverage(base, days === 1 ? 12 : 8);
        const formatted = base.map((item, index) => ({
          ...item,
          ma: ma[index],
        }));
        setError("");
        setData(formatted);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load chart data right now.");
        setData([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [coinId, days, vsCurrency]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading chart...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!data.length) {
    return <p className="text-sm text-gray-500">No chart data available.</p>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="time" />
          <YAxis
            yAxisId="left"
            domain={["auto", "auto"]}
            tickFormatter={(value) => `${String(vsCurrency).toUpperCase()} ${Number(value).toLocaleString()}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${String(vsCurrency).toUpperCase()} ${Number(value).toLocaleString()}`}
          />
          <Tooltip
            formatter={(value, name) => [
              `${String(vsCurrency).toUpperCase()} ${Number(value).toLocaleString()}`,
              name === "price" ? "Price" : name === "ma" ? "Moving Avg" : "Volume",
            ]}
          />
          <Legend />
          <Area
            yAxisId="right"
            dataKey="volume"
            name="volume"
            stroke="#f59e0b"
            fill="#fcd34d"
            fillOpacity={0.2}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="price"
            name="price"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={700}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ma"
            name="ma"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 4"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}