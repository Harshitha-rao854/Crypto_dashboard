const FILTERS = [
  { id: "all", label: "All Coins" },
  { id: "gainers", label: "Top Gainers" },
  { id: "losers", label: "Top Losers" },
  { id: "stablecoins", label: "Stablecoins" },
];

const SORTS = [
  { id: "market_cap", label: "Market Cap" },
  { id: "price", label: "Price" },
  { id: "change_24h", label: "24h Change" },
];

export default function MarketControls({
  filterBy,
  setFilterBy,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  rankMin,
  rankMax,
  setRankMin,
  setRankMax,
  priceMin,
  priceMax,
  setPriceMin,
  setPriceMax,
  currencyLabel = "USD",
}) {
  return (
    <div className="my-4 grid gap-3 rounded-lg bg-white p-3 shadow dark:bg-gray-900 lg:grid-cols-3">
      <label className="text-sm">
        <span className="mb-1 block text-gray-600 dark:text-gray-300">Filter</span>
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="w-full rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
        >
          {FILTERS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-gray-600 dark:text-gray-300">Sort By</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
        >
          {SORTS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-gray-600 dark:text-gray-300">Direction</span>
        <select
          value={sortDirection}
          onChange={(e) => setSortDirection(e.target.value)}
          className="w-full rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </label>

      <div className="grid gap-3 md:grid-cols-2 lg:col-span-3">
        <label className="text-sm">
          <span className="mb-1 block text-gray-600 dark:text-gray-300">Rank range</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="1"
              value={rankMin}
              onChange={(e) => setRankMin(e.target.value)}
              placeholder="Min (e.g. 1)"
              className="w-full rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
            />
            <input
              type="number"
              min="1"
              value={rankMax}
              onChange={(e) => setRankMax(e.target.value)}
              placeholder="Max (e.g. 50)"
              className="w-full rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-gray-600 dark:text-gray-300">
            Price range ({currencyLabel})
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Min"
              className="w-full rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
            />
            <input
              type="number"
              min="0"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Max"
              className="w-full rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
