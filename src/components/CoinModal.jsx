import CoinChart from "./CoinChart";
import { useState } from "react";

export default function CoinModal({ coin, onClose, vsCurrency = "usd" }) {
  const [days, setDays] = useState(7);

  if (!coin) return null;

  const has24hChange = Number.isFinite(coin.price_change_percentage_24h);
  const changeClass = has24hChange
    ? coin.price_change_percentage_24h > 0
      ? "text-green-500"
      : "text-red-500"
    : "text-gray-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded w-[min(95vw,700px)]">
        <button onClick={onClose} className="float-right text-red-500">
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <img src={coin.image} alt={coin.name} className="w-8 h-8" />
          <h2 className="text-xl font-bold">
            {coin.name} ({coin.symbol.toUpperCase()})
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <p>Price: ${coin.current_price.toLocaleString()}</p>
          <p className={changeClass}>
            24h: {has24hChange ? `${coin.price_change_percentage_24h.toFixed(2)}%` : "N/A"}
          </p>
          <p>Market Cap: ${coin.market_cap.toLocaleString()}</p>
          <p>Rank: #{coin.market_cap_rank}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "1D", value: 1 },
            { label: "7D", value: 7 },
            { label: "1M", value: 30 },
            { label: "1Y", value: 365 },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setDays(range.value)}
              className={`px-3 py-1 rounded ${
                days === range.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <CoinChart coinId={coin.id} days={days} vsCurrency={vsCurrency} />
      </div>
    </div>
  );
}