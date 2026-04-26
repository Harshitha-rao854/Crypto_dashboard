import { useEffect, useMemo, useRef, useState } from "react";

export default function SearchBar({ search, setSearch, suggestions = [], onPickSuggestion }) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const visibleSuggestions = useMemo(() => {
    const q = search.trim();
    if (!open || q.length < 1) return [];
    return suggestions.slice(0, 6);
  }, [open, search, suggestions]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pickCoin = (coin) => {
    if (!coin) return;
    onPickSuggestion?.(coin);
    setSearch("");
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="group relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 21L16.65 16.65"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <input
          type="text"
          placeholder="Search coins by name or symbol…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((idx) => Math.min(visibleSuggestions.length - 1, idx + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((idx) => Math.max(-1, idx - 1));
            } else if (e.key === "Enter") {
              if (activeIndex >= 0) {
                e.preventDefault();
                pickCoin(visibleSuggestions[activeIndex]);
              }
            }
          }}
          className="w-full rounded-xl border bg-white px-10 py-3 shadow-sm outline-none ring-0 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-gray-700 dark:bg-gray-900"
          aria-label="Search cryptocurrencies"
          autoComplete="off"
        />

        {search.trim().length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setOpen(false);
              setActiveIndex(-1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Clear search"
            title="Clear"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      {visibleSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {visibleSuggestions.map((coin) => (
            <button
              key={coin.id}
              type="button"
              onClick={() => {
                pickCoin(coin);
              }}
              onMouseEnter={() => setActiveIndex(visibleSuggestions.findIndex((c) => c.id === coin.id))}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                activeIndex >= 0 && visibleSuggestions[activeIndex]?.id === coin.id
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <img src={coin.image} alt="" className="h-5 w-5" />
              <span className="font-medium">{coin.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                {coin.symbol?.toUpperCase()}
              </span>
              {Number.isFinite(coin.market_cap_rank) && (
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-300">
                  #{coin.market_cap_rank}
                </span>
              )}
            </button>
          ))}
          <div className="border-t px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-300">
            Tip: Use ↑ ↓ then Enter
          </div>
        </div>
      )}
    </div>
  );
}