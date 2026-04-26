import { Line, LineChart, ResponsiveContainer } from "recharts";

function toSeries(prices) {
  if (!Array.isArray(prices) || prices.length === 0) return [];
  return prices.map((price, idx) => ({ idx, price }));
}

export default function Sparkline({ prices }) {
  const series = toSeries(prices);
  if (!series.length) return null;

  const first = series[0].price;
  const last = series[series.length - 1].price;
  const rising = last >= first;
  const stroke = rising ? "#10b981" : "#ef4444";

  return (
    <div className="h-10 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <Line
            type="monotone"
            dataKey="price"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

