import Sparkline from "./Sparkline";
import { formatMoney } from "../utils/format";

export default function CryptoRow({
  coin,
  onSelect,
  toggleFav,
  favorites,
  priceTrends,
  canFavorite,
  vsCurrency = "usd",
}) {
  const trend = priceTrends?.[coin.id];
  const trendClass = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "";
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "";
  const flashClass = trend === "up" ? "flash-up" : trend === "down" ? "flash-down" : "";
  const has24hChange = Number.isFinite(coin.price_change_percentage_24h);
  const change24hClass = has24hChange
    ? coin.price_change_percentage_24h > 0
      ? "text-green-500"
      : "text-red-500"
    : "text-gray-500";

  return (
    <tr
      className="border-b cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={() => onSelect(coin)}
    >
      <td className="flex items-center gap-2 p-3">
        <img src={coin.image} className="w-6 h-6" />
        {coin.name} ({coin.symbol.toUpperCase()})
      </td>

      <td className={`p-3 ${trendClass} ${flashClass} rounded px-1 transition-colors duration-500`}>
        {formatMoney(coin.current_price, vsCurrency, { maximumFractionDigits: 8 })} {trendArrow}
      </td>

      <td className={`p-3 ${change24hClass}`}>
        {has24hChange ? `${coin.price_change_percentage_24h.toFixed(2)}%` : "N/A"}
      </td>

      <td className="p-3">
        {formatMoney(coin.market_cap, vsCurrency, { notation: "compact", maximumFractionDigits: 2 })}
      </td>

      <td className="p-3">
        <Sparkline prices={coin.sparkline_in_7d?.price} />
      </td>

      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => toggleFav(coin.id)}
          disabled={!canFavorite}
          title={!canFavorite ? "Login to add favorites" : "Toggle favorite"}
          className={`inline-flex h-8 w-8 items-center justify-center rounded ${
            !canFavorite ? "cursor-not-allowed opacity-50" : "hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {favorites.includes(coin.id) ? "⭐" : "☆"}
        </button>
      </td>
    </tr>
  );
}