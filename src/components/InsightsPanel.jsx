function getInsights(coins) {
  if (!coins.length) return null;
  const coinsWith24hChange = coins.filter((coin) =>
    Number.isFinite(coin.price_change_percentage_24h)
  );
  if (!coinsWith24hChange.length) return null;

  const topGainer = [...coinsWith24hChange].sort(
    (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
  )[0];
  const mostVolatile = [...coinsWith24hChange].sort(
    (a, b) =>
      Math.abs(b.price_change_percentage_24h) -
      Math.abs(a.price_change_percentage_24h)
  )[0];
  const avgChange =
    coinsWith24hChange.reduce((sum, coin) => sum + coin.price_change_percentage_24h, 0) /
    coinsWith24hChange.length;
  const gainersCount = coinsWith24hChange.filter(
    (coin) => coin.price_change_percentage_24h > 0
  ).length;
  const breadth = gainersCount / coinsWith24hChange.length;
  const volatility =
    coinsWith24hChange.reduce(
      (sum, coin) => sum + Math.abs(coin.price_change_percentage_24h),
      0
    ) / coinsWith24hChange.length;

  const marketTrend =
    avgChange > 1 ? "Bullish momentum" : avgChange < -1 ? "Bearish pressure" : "Mostly sideways";

  let aiSignal = "Neutral";
  if (avgChange > 1 && breadth > 0.55) aiSignal = "Bullish";
  else if (avgChange < -1 && breadth < 0.45) aiSignal = "Bearish";

  const confidence = Math.min(
    92,
    Math.max(55, Math.round(60 + Math.abs(avgChange) * 8 + Math.abs(breadth - 0.5) * 35))
  );

  const aiOutlook =
    aiSignal === "Bullish"
      ? `Market is slightly bullish with ${volatility > 4 ? "high" : "controlled"} volatility. Buyers are showing stronger conviction across major coins.`
      : aiSignal === "Bearish"
        ? `Market is slightly bearish with ${volatility > 4 ? "elevated" : "low"} volatility. Investors remain cautious and downside pressure is still visible.`
        : `Market is mostly balanced with ${volatility > 4 ? "choppy" : "low"} volatility. Investors appear cautious while waiting for a stronger trend.`;

  return {
    topGainer,
    mostVolatile,
    marketTrend,
    avgChange,
    aiSignal,
    confidence,
    aiOutlook,
  };
}

export default function InsightsPanel({ coins }) {
  const insights = getInsights(coins);

  if (!insights) return null;

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-4">
      <article className="rounded-lg bg-white p-4 shadow dark:bg-gray-900">
        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Top Gainer Today</p>
        <h3 className="mt-1 text-lg font-semibold">
          {insights.topGainer.name} ({insights.topGainer.symbol.toUpperCase()})
        </h3>
        <p className="text-green-500">+{insights.topGainer.price_change_percentage_24h.toFixed(2)}%</p>
      </article>

      <article className="rounded-lg bg-white p-4 shadow dark:bg-gray-900">
        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Most Volatile Coin</p>
        <h3 className="mt-1 text-lg font-semibold">
          {insights.mostVolatile.name} ({insights.mostVolatile.symbol.toUpperCase()})
        </h3>
        <p className="text-blue-500">
          {insights.mostVolatile.price_change_percentage_24h.toFixed(2)}% in 24h
        </p>
      </article>

      <article className="rounded-lg bg-white p-4 shadow dark:bg-gray-900">
        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Market Trend Summary</p>
        <h3 className="mt-1 text-lg font-semibold">{insights.marketTrend}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Avg 24h change: {insights.avgChange.toFixed(2)}%
        </p>
      </article>

      <article className="rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow">
        <p className="text-xs uppercase text-indigo-100">AI Market Signal</p>
        <h3 className="mt-1 text-lg font-semibold">
          {insights.aiSignal === "Bullish"
            ? "Bullish 📈"
            : insights.aiSignal === "Bearish"
              ? "Bearish 📉"
              : "Neutral ↔"}
        </h3>
        <p className="text-sm text-indigo-100">Confidence: {insights.confidence}%</p>
        <p className="mt-2 text-sm leading-5 text-indigo-50">{insights.aiOutlook}</p>
      </article>
    </div>
  );
}
