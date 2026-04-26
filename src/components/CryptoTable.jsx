import CryptoRow from "./CryptoRow";
import { formatMoney } from "../utils/format";

export default function CryptoTable({
  data,
  onSelect,
  toggleFav,
  favorites,
  priceTrends,
  canFavorite,
  vsCurrency,
}) {
  return (
    <div className="mt-4">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="p-3 text-left">Coin</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">24h</th>
              <th className="p-3 text-left">Market Cap</th>
              <th className="p-3 text-left">7d</th>
              <th className="p-3 text-center">Fav</th>
            </tr>
          </thead>
          <tbody>
            {data.map((coin) => (
              <CryptoRow
                key={coin.id}
                coin={coin}
                onSelect={onSelect}
                toggleFav={toggleFav}
                favorites={favorites}
                priceTrends={priceTrends}
                canFavorite={canFavorite}
                vsCurrency={vsCurrency}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {data.map((coin) => {
          const trend = priceTrends?.[coin.id];
          const trendClass =
            trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "";
          const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "";
          const flashClass = trend === "up" ? "flash-up" : trend === "down" ? "flash-down" : "";
          const has24hChange = Number.isFinite(coin.price_change_percentage_24h);
          const change24hClass = has24hChange
            ? coin.price_change_percentage_24h > 0
              ? "text-green-500"
              : "text-red-500"
            : "text-gray-500";
          return (
            <article
              key={coin.id}
              onClick={() => onSelect(coin)}
              className="cursor-pointer rounded-lg bg-white p-3 shadow transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={coin.image} className="h-6 w-6" />
                  <p className="font-semibold">
                    {coin.name} ({coin.symbol.toUpperCase()})
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(coin.id);
                  }}
                  disabled={!canFavorite}
                  title={!canFavorite ? "Login to add favorites" : "Toggle favorite"}
                  className={!canFavorite ? "cursor-not-allowed opacity-50" : ""}
                >
                  {favorites.includes(coin.id) ? "⭐" : "☆"}
                </button>
              </div>
              <p className={`text-sm ${trendClass} ${flashClass} rounded px-1`}>
                Price: {formatMoney(coin.current_price, vsCurrency, { maximumFractionDigits: 8 })} {trendArrow}
              </p>
              <p className={`text-sm ${change24hClass}`}>
                24h: {has24hChange ? `${coin.price_change_percentage_24h.toFixed(2)}%` : "N/A"}
              </p>
              <p className="text-sm">
                MCap:{" "}
                {formatMoney(coin.market_cap, vsCurrency, {
                  notation: "compact",
                  maximumFractionDigits: 2,
                })}
              </p>
            </article>
          );
        })}
      </div>
      {!canFavorite && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Login is required to add or remove favorites.
        </p>
      )}
    </div>
  );
}