import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import CryptoTable from "./components/CryptoTable";
import Skeleton from "./components/Skeleton";
import MarketControls from "./components/MarketControls";
import InsightsPanel from "./components/InsightsPanel";
import MarketVisuals from "./components/MarketVisuals";
import AuthPanel from "./components/AuthPanel";
import PortfolioPanel from "./components/PortfolioPanel";
import CoinDetailsPage from "./pages/CoinDetailsPage";
import useCryptoData from "./hooks/useCryptoData";
import useDebouncedValue from "./hooks/useDebouncedValue";
import {
  fetchPortfolio,
  fetchWatchlist,
  login,
  savePortfolio,
  saveWatchlist,
  setAuthToken,
  signup,
} from "./services/api";

function applyFilterAndSort(coins, { filterBy, sortBy, sortDirection }) {
  let filtered = [...coins];
  if (filterBy === "gainers") {
    filtered = filtered.filter((coin) => coin.price_change_percentage_24h > 0);
  } else if (filterBy === "losers") {
    filtered = filtered.filter((coin) => coin.price_change_percentage_24h < 0);
  } else if (filterBy === "stablecoins") {
    filtered = filtered.filter((coin) => Math.abs(coin.price_change_percentage_24h) < 1);
  }

  const keyMap = {
    market_cap: "market_cap",
    price: "current_price",
    change_24h: "price_change_percentage_24h",
  };
  const sortKey = keyMap[sortBy] || "market_cap";
  filtered.sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * direction;
  });
  return filtered;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCoinPage = location.pathname.startsWith("/coin/");
  const isWatchlistPage = location.pathname === "/watchlist";
  const isMarketPage = location.pathname === "/";
  const [vsCurrency, setVsCurrency] = useState(localStorage.getItem("vs_currency") || "usd");
  const { data, previousData, loading, error, retry, lastUpdated } = useCryptoData({
    vsCurrency,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("market_cap");
  const [sortDirection, setSortDirection] = useState("desc");
  const [rankMin, setRankMin] = useState("");
  const [rankMax, setRankMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [favorites, setFavorites] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [authError, setAuthError] = useState("");
  const [watchlistMessage, setWatchlistMessage] = useState("");
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [alertCoinId, setAlertCoinId] = useState("");
  const [alertTargetPrice, setAlertTargetPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState("above");
  const [alertToast, setAlertToast] = useState(null);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("crypto_user")) || null
  );
  const [token, setToken] = useState(localStorage.getItem("crypto_token") || "");

  useEffect(() => {
    localStorage.setItem("vs_currency", vsCurrency);
  }, [vsCurrency]);

  const watchlistStorageKey = user
    ? `crypto_watchlist_${user.username || user.id || "user"}`
    : "crypto_watchlist_guest";
  const portfolioStorageKey = user
    ? `crypto_portfolio_${user.username || user.id || "user"}`
    : "crypto_portfolio_guest";
  const alertsStorageKey = user
    ? `crypto_alerts_${user.username || user.id || "user"}`
    : "crypto_alerts_guest";

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (!user || !token) return;
    fetchWatchlist()
      .then((items) => {
        setFavorites(items);
        localStorage.setItem(watchlistStorageKey, JSON.stringify(items));
      })
      .catch(() => {
        const cached = JSON.parse(localStorage.getItem(watchlistStorageKey) || "[]");
        setFavorites(Array.isArray(cached) ? cached : []);
      });
    fetchPortfolio()
      .then((items) => {
        setHoldings(items);
        localStorage.setItem(portfolioStorageKey, JSON.stringify(items));
      })
      .catch(() => {
        const cached = JSON.parse(localStorage.getItem(portfolioStorageKey) || "[]");
        setHoldings(Array.isArray(cached) ? cached : []);
      });
  }, [user, token, watchlistStorageKey, portfolioStorageKey]);

  useEffect(() => {
    if (!watchlistMessage) return;
    const timer = setTimeout(() => setWatchlistMessage(""), 2000);
    return () => clearTimeout(timer);
  }, [watchlistMessage]);

  useEffect(() => {
    const cachedAlerts = JSON.parse(localStorage.getItem(alertsStorageKey) || "[]");
    setPriceAlerts(Array.isArray(cachedAlerts) ? cachedAlerts : []);
  }, [alertsStorageKey]);

  useEffect(() => {
    localStorage.setItem(alertsStorageKey, JSON.stringify(priceAlerts));
  }, [priceAlerts, alertsStorageKey]);

  useEffect(() => {
    if (!alertToast) return;
    const timer = setTimeout(() => setAlertToast(null), 3500);
    return () => clearTimeout(timer);
  }, [alertToast]);

  const toggleFav = (id) => {
    if (!user) return;

    const isRemoving = favorites.includes(id);
    const next = isRemoving
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(watchlistStorageKey, JSON.stringify(next));
    setWatchlistMessage(isRemoving ? "Removed from Watchlist" : "Added to Watchlist");
    saveWatchlist(next).catch(() => {});
  };

  const addPriceAlert = () => {
    const target = Number(alertTargetPrice);
    if (!alertCoinId || !Number.isFinite(target) || target <= 0) return;
    const coin = data.find((item) => item.id === alertCoinId);
    if (!coin) return;

    const newAlert = {
      id: `${alertCoinId}-${alertDirection}-${target}-${Date.now()}`,
      coinId: alertCoinId,
      symbol: coin.symbol?.toUpperCase() || coin.name,
      coinName: coin.name,
      direction: alertDirection,
      targetPrice: target,
      triggered: false,
      createdAt: new Date().toISOString(),
    };
    setPriceAlerts((prev) => [newAlert, ...prev]);
    setAlertTargetPrice("");
  };

  const removePriceAlert = (alertId) => {
    setPriceAlerts((prev) => prev.filter((item) => item.id !== alertId));
  };

  const handleLogin = async ({ username, password }) => {
    try {
      const payload = await login(username, password);
      setUser(payload.user);
      setToken(payload.token);
      localStorage.setItem("crypto_user", JSON.stringify(payload.user));
      localStorage.setItem("crypto_token", payload.token);
      setAuthError("");
    } catch (err) {
      if (!err?.response) {
        setAuthError("Auth server not reachable. Run backend with: npm run dev:api");
      } else {
        setAuthError("Invalid login credentials.");
      }
    }
  };

  const handleSignup = async ({ username, password }) => {
    try {
      const payload = await signup(username, password);
      setUser(payload.user);
      setToken(payload.token);
      localStorage.setItem("crypto_user", JSON.stringify(payload.user));
      localStorage.setItem("crypto_token", payload.token);
      setAuthError("");
    } catch (err) {
      if (!err?.response) {
        setAuthError("Auth server not reachable. Run backend with: npm run dev:api");
      } else {
        setAuthError("Signup failed. Username may already exist.");
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    setFavorites([]);
    setHoldings([]);
    localStorage.removeItem("crypto_user");
    localStorage.removeItem("crypto_token");
  };

  const applySearchAndRanges = useMemo(() => {
    return (coins) => {
      const searched = coins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          coin.symbol.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      const parsedRankMin = Number(rankMin);
      const parsedRankMax = Number(rankMax);
      const parsedPriceMin = Number(priceMin);
      const parsedPriceMax = Number(priceMax);

      let ranged = searched;
      if (Number.isFinite(parsedRankMin) && parsedRankMin > 0) {
        ranged = ranged.filter((c) => (Number(c.market_cap_rank) || Infinity) >= parsedRankMin);
      }
      if (Number.isFinite(parsedRankMax) && parsedRankMax > 0) {
        ranged = ranged.filter((c) => (Number(c.market_cap_rank) || Infinity) <= parsedRankMax);
      }
      if (Number.isFinite(parsedPriceMin) && parsedPriceMin >= 0) {
        ranged = ranged.filter((c) => (Number(c.current_price) || 0) >= parsedPriceMin);
      }
      if (Number.isFinite(parsedPriceMax) && parsedPriceMax > 0) {
        ranged = ranged.filter((c) => (Number(c.current_price) || 0) <= parsedPriceMax);
      }

      return applyFilterAndSort(ranged, { filterBy, sortBy, sortDirection });
    };
  }, [
    debouncedSearch,
    filterBy,
    priceMax,
    priceMin,
    rankMax,
    rankMin,
    sortBy,
    sortDirection,
  ]);

  const marketFilteredData = useMemo(() => applySearchAndRanges(data), [applySearchAndRanges, data]);

  const watchlistBaseData = useMemo(
    () => data.filter((coin) => favorites.includes(coin.id)),
    [data, favorites]
  );
  const watchlistFilteredData = useMemo(
    () => applySearchAndRanges(watchlistBaseData),
    [applySearchAndRanges, watchlistBaseData]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterBy, sortBy, sortDirection, rankMin, rankMax, priceMin, priceMax]);

  const totalPages = Math.max(1, Math.ceil(marketFilteredData.length / pageSize));
  const pagedData = useMemo(() => {
    const safePage = Math.min(totalPages, Math.max(1, page));
    const start = (safePage - 1) * pageSize;
    return marketFilteredData.slice(start, start + pageSize);
  }, [marketFilteredData, page, pageSize, totalPages]);

  const searchSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const base = isWatchlistPage ? watchlistBaseData : data;
    const matches = base.filter(
      (coin) =>
        coin.name.toLowerCase().includes(q) || coin.symbol.toLowerCase().includes(q)
    );
    return matches.slice(0, 6);
  }, [data, isWatchlistPage, search, watchlistBaseData]);
  const visibleFavorites = user ? favorites : [];

  const priceTrends = useMemo(() => {
    const previousMap = Object.fromEntries(
      previousData.map((coin) => [coin.id, coin.current_price])
    );
    const trends = {};
    data.forEach((coin) => {
      const previous = previousMap[coin.id];
      trends[coin.id] =
        typeof previous !== "number"
          ? ""
          : coin.current_price > previous
            ? "up"
            : coin.current_price < previous
              ? "down"
              : "";
    });
    return trends;
  }, [data, previousData]);

  useEffect(() => {
    if (loading) return;
    setIsRefreshing(true);
    const id = setTimeout(() => setIsRefreshing(false), 550);
    return () => clearTimeout(id);
  }, [data, loading]);

  const marketById = useMemo(
    () => Object.fromEntries(data.map((coin) => [coin.id, coin])),
    [data]
  );

  useEffect(() => {
    if (!data.length || !priceAlerts.length) return;

    const coinsById = Object.fromEntries(data.map((coin) => [coin.id, coin]));
    const fired = [];

    const nextAlerts = priceAlerts.map((alert) => {
      if (alert.triggered) return alert;
      const coin = coinsById[alert.coinId];
      const currentPrice = coin?.current_price;
      if (!Number.isFinite(currentPrice)) return alert;

      const crossed =
        alert.direction === "above"
          ? currentPrice >= alert.targetPrice
          : currentPrice <= alert.targetPrice;
      if (!crossed) return alert;

      fired.push({
        id: `${alert.id}-${Date.now()}`,
        text:
          alert.direction === "above"
            ? `${alert.symbol} crossed above $${alert.targetPrice.toLocaleString()} at $${currentPrice.toLocaleString()} 🚀`
            : `${alert.symbol} dropped below $${alert.targetPrice.toLocaleString()} at $${currentPrice.toLocaleString()} 📉`,
      });
      return { ...alert, triggered: true, triggeredAt: new Date().toISOString() };
    });

    if (fired.length > 0) {
      setPriceAlerts(nextAlerts);
      setAlertToast(fired[0]);
    }
  }, [data, priceAlerts]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-black dark:text-white transition-colors duration-500">
      <Navbar currency={vsCurrency} onCurrencyChange={setVsCurrency} />

      <div className="mx-auto max-w-6xl p-3 pt-28 sm:p-4 sm:pt-24">
        {!isCoinPage && (
          <>
            <AuthPanel
              user={user}
              onLogin={handleLogin}
              onSignup={handleSignup}
              onLogout={handleLogout}
              authError={authError}
              onClearAuthError={() => setAuthError("")}
            />
            {authError && <p className="text-sm text-red-500">{authError}</p>}
            {watchlistMessage && (
              <p className="mt-2 inline-block rounded bg-emerald-100 px-3 py-1 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {watchlistMessage}
              </p>
            )}
            <SearchBar
              search={search}
              setSearch={setSearch}
              suggestions={searchSuggestions}
              onPickSuggestion={(coin) => navigate(`/coin/${coin.id}`)}
            />
            <MarketControls
              filterBy={filterBy}
              setFilterBy={setFilterBy}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              rankMin={rankMin}
              rankMax={rankMax}
              setRankMin={setRankMin}
              setRankMax={setRankMax}
              priceMin={priceMin}
              priceMax={priceMax}
              setPriceMin={setPriceMin}
              setPriceMax={setPriceMax}
              currencyLabel={String(vsCurrency).toUpperCase()}
            />
            {lastUpdated && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
                Last Updated:{" "}
                {new Date(lastUpdated).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
                {isRefreshing && (
                  <span className="ml-2 text-indigo-600 dark:text-indigo-300">• updating</span>
                )}
              </p>
            )}
            {isMarketPage && (
              <>
                <InsightsPanel coins={marketFilteredData} />
                <MarketVisuals coins={marketFilteredData} vsCurrency={vsCurrency} />
                <section className="mt-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                  <h2 className="text-lg font-semibold">Price Alerts</h2>
                  <div className="mt-3 grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                    <select
                      value={alertCoinId}
                      onChange={(e) => setAlertCoinId(e.target.value)}
                      className="rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="">Select coin</option>
                      {data.map((coin) => (
                        <option key={coin.id} value={coin.id}>
                          {coin.name} ({coin.symbol?.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <select
                      value={alertDirection}
                      onChange={(e) => setAlertDirection(e.target.value)}
                      className="rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                    <input
                      type="number"
                      value={alertTargetPrice}
                      onChange={(e) => setAlertTargetPrice(e.target.value)}
                      placeholder="Target price"
                      className="rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <button
                      onClick={addPriceAlert}
                      disabled={!alertCoinId || Number(alertTargetPrice) <= 0}
                      className="w-full rounded bg-indigo-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                    >
                      Set Alert
                    </button>
                  </div>
                  {!priceAlerts.length ? (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
                      No alerts yet. Create one to get notified when a price crosses your target.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2 text-sm">
                      {priceAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex flex-col items-start justify-between gap-2 rounded bg-gray-100 p-2 dark:bg-gray-800 sm:flex-row sm:items-center"
                        >
                          <p className="break-words">
                            {alert.symbol} {alert.direction === "above" ? ">" : "<"} $
                            {alert.targetPrice.toLocaleString()}{" "}
                            <span className="text-xs text-gray-500 dark:text-gray-300">
                              Current:{" "}
                              {Number.isFinite(marketById[alert.coinId]?.current_price)
                                ? `$${marketById[alert.coinId].current_price.toLocaleString()}`
                                : "N/A"}
                            </span>{" "}
                            <span
                              className={`ml-2 rounded px-2 py-0.5 text-xs ${
                                alert.triggered
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              }`}
                            >
                              {alert.triggered ? "🔴 Triggered" : "🟢 Active"}
                            </span>
                          </p>
                          <button
                            onClick={() => removePriceAlert(alert.id)}
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}

        <Routes>
          <Route
            path="/"
            element={
              loading ? (
                <Skeleton />
              ) : error ? (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                  <p>{error}</p>
                  <button
                    onClick={retry}
                    className="mt-3 rounded bg-red-600 px-3 py-1 text-sm text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : marketFilteredData.length === 0 ? (
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  No coins found for your search.
                </p>
              ) : (
                <div className="mt-4">
                  <CryptoTable
                    data={pagedData}
                    vsCurrency={vsCurrency}
                    onSelect={(coin) => navigate(`/coin/${coin.id}`)}
                    toggleFav={toggleFav}
                    favorites={visibleFavorites}
                    priceTrends={priceTrends}
                    canFavorite={Boolean(user)}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm shadow dark:bg-gray-900">
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      Showing{" "}
                      <span className="font-semibold">{pagedData.length}</span> of{" "}
                      <span className="font-semibold">{marketFilteredData.length}</span> coins
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        Page <span className="font-semibold">{page}</span> / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          />
          <Route
            path="/watchlist"
            element={
              !user ? (
                <div className="mt-4 rounded bg-yellow-100 p-4 text-yellow-800">
                  Please login to view your watchlist.
                </div>
              ) : watchlistBaseData.length === 0 ? (
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  No favorites yet. Star coins from the market page.
                </p>
              ) : (
                watchlistFilteredData.length === 0 ? (
                  <p className="mt-4 text-gray-600 dark:text-gray-300">
                    No watchlisted coins match your filters.
                  </p>
                ) : (
                  <CryptoTable
                    data={watchlistFilteredData}
                    vsCurrency={vsCurrency}
                    onSelect={(coin) => navigate(`/coin/${coin.id}`)}
                    toggleFav={toggleFav}
                    favorites={visibleFavorites}
                    priceTrends={priceTrends}
                    canFavorite={Boolean(user)}
                  />
                )
              )
            }
          />
          <Route path="/coin/:coinId" element={<CoinDetailsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!isCoinPage && isMarketPage && (
          <PortfolioPanel
            coins={marketFilteredData}
            holdings={holdings}
            disabled={!user}
            onSave={(next) => {
              setHoldings(next);
              localStorage.setItem(portfolioStorageKey, JSON.stringify(next));
              savePortfolio(next).catch(() => {});
            }}
          />
        )}
      </div>
      {alertToast && (
        <div className="fixed bottom-4 left-3 right-3 z-[60] rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 shadow-lg dark:border-indigo-700 dark:bg-indigo-900/90 dark:text-indigo-100 sm:left-auto sm:right-4 sm:max-w-sm">
          <p className="font-semibold">Price Alert</p>
          <p className="mt-1">{alertToast.text}</p>
        </div>
      )}
    </div>
  );
}