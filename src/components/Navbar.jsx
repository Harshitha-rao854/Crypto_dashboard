import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar({ currency = "usd", onCurrencyChange }) {
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-white px-3 py-3 shadow dark:bg-gray-900 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <h1 className="truncate text-lg font-bold text-blue-500 sm:text-2xl">🚀 Crypto Tracker</h1>
        <nav className="flex gap-2 text-xs sm:text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded px-2 py-1 ${isActive ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300"}`
            }
          >
            Market
          </NavLink>
          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              `rounded px-2 py-1 ${isActive ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300"}`
            }
          >
            Watchlist
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <label className="hidden text-xs text-gray-600 dark:text-gray-300 sm:block">
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange?.(e.target.value)}
          className="rounded border bg-white px-2 py-1 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800"
          aria-label="Currency selector"
        >
          <option value="usd">USD</option>
          <option value="inr">INR</option>
        </select>
        <button
          onClick={() => setDark(!dark)}
          className="rounded bg-blue-500 px-3 py-1 text-sm text-white sm:px-4"
        >
          {dark ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );
}