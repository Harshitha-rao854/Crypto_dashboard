import { useMemo, useState } from "react";

export default function PortfolioPanel({ coins, holdings, onSave, disabled }) {
  const [coinId, setCoinId] = useState("");
  const [amount, setAmount] = useState("");

  const byId = useMemo(
    () => Object.fromEntries(coins.map((coin) => [coin.id, coin])),
    [coins]
  );

  const valued = useMemo(
    () =>
      holdings.map((holding) => {
        const coin = byId[holding.coinId];
        const price = coin?.current_price || 0;
        const buyPrice = Number.isFinite(holding.buyPrice) ? holding.buyPrice : price;
        const profitLoss = (price - buyPrice) * holding.amount;
        const profitPercent = buyPrice > 0 ? ((price - buyPrice) / buyPrice) * 100 : 0;
        return {
          ...holding,
          name: coin?.name || holding.coinId,
          value: price * holding.amount,
          price,
          buyPrice,
          profitLoss,
          profitPercent,
        };
      }),
    [holdings, byId]
  );

  const totalValue = valued.reduce((sum, row) => sum + row.value, 0);
  const totalProfitLoss = valued.reduce((sum, row) => sum + row.profitLoss, 0);
  const totalInvested = valued.reduce((sum, row) => sum + row.buyPrice * row.amount, 0);
  const portfolioInsight = useMemo(() => {
    if (!valued.length || totalValue <= 0) {
      return "Add at least one holding to unlock AI portfolio insights.";
    }

    const topHolding = valued.reduce((best, row) => (row.value > best.value ? row : best), valued[0]);
    const concentration = (topHolding.value / totalValue) * 100;

    if (concentration >= 75) {
      return `Your portfolio is heavily concentrated in ${topHolding.name} (${concentration.toFixed(
        1
      )}%), indicating low diversification and higher risk.`;
    }
    if (concentration >= 45) {
      return `Your portfolio leans toward ${topHolding.name} (${concentration.toFixed(
        1
      )}%). Consider adding uncorrelated assets to reduce concentration risk.`;
    }
    return `Your portfolio is reasonably diversified. Top allocation is ${topHolding.name} at ${concentration.toFixed(
      1
    )}%.`;
  }, [valued, totalValue]);
  const parsedAmount = Number(amount);
  const isAddDisabled =
    !coinId ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount <= 0 ||
    !Number.isFinite(byId[coinId]?.current_price);

  const addHolding = () => {
    if (!coinId || !amount) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const coin = byId[coinId];
    const buyPrice = Number(coin?.current_price || 0);
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) return;

    const existing = holdings.find((item) => item.coinId === coinId);
    let next;
    if (existing) {
      const nextAmount = existing.amount + parsed;
      const weightedBuyPrice =
        nextAmount > 0 ? (existing.buyPrice * existing.amount + buyPrice * parsed) / nextAmount : buyPrice;
      next = holdings.map((item) =>
        item.coinId === coinId ? { ...item, amount: nextAmount, buyPrice: weightedBuyPrice } : item
      );
    } else {
      next = [...holdings, { coinId, amount: parsed, buyPrice }];
    }
    onSave(next);
    setAmount("");
  };

  const removeHolding = (targetCoinId) => {
    const next = holdings.filter((item) => item.coinId !== targetCoinId);
    onSave(next);
  };

  return (
    <section className="mt-6 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
      <h2 className="text-lg font-semibold">Portfolio</h2>
      {!disabled ? (
        <>
          {!coins.length && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              Market prices are still loading. Portfolio actions will be enabled shortly.
            </p>
          )}
          <div className="mt-3 grid gap-2 md:grid-cols-[2fr_1fr_auto]">
            <select
              value={coinId}
              onChange={(e) => setCoinId(e.target.value)}
              className="rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Select coin</option>
              {coins.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (e.g., 0.5)"
              className="rounded border p-2 dark:border-gray-700 dark:bg-gray-800"
            />
            <button
              onClick={addHolding}
              disabled={isAddDisabled}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Portfolio
            </button>
          </div>
          {coinId && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
              Current Price:{" "}
              {Number.isFinite(byId[coinId]?.current_price)
                ? `$${byId[coinId].current_price.toFixed(2)}`
                : "Unavailable"}
            </p>
          )}

          <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
            <p className="rounded bg-gray-100 p-2 font-semibold dark:bg-gray-800">
              Total Invested: $
              {totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="rounded bg-gray-100 p-2 font-semibold dark:bg-gray-800">
              Total Value: ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p
              className={`rounded p-2 font-semibold ${
                totalProfitLoss >= 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}
            >
              Total Profit/Loss: {totalProfitLoss >= 0 ? "+" : "-"}$
              {Math.abs(totalProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="mt-3 rounded border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
            {portfolioInsight}
          </p>

          {!valued.length ? (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
              No holdings yet. Add your first coin above.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="p-2">Coin</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Buy Price</th>
                    <th className="p-2">Current Price</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">Profit/Loss</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {valued.map((row) => (
                    <tr key={row.coinId} className="border-b dark:border-gray-800">
                      <td className="p-2 font-medium">{row.name}</td>
                      <td className="p-2">{row.amount}</td>
                      <td className="p-2">
                        ${row.buyPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2">
                        {row.price > 0
                          ? `$${row.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                          : "Unavailable"}
                      </td>
                      <td className="p-2">
                        ${row.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`p-2 font-semibold ${
                          row.profitLoss >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {row.profitLoss >= 0 ? "+" : "-"}$
                        {Math.abs(row.profitLoss).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                        {" "}
                        ({row.profitPercent.toFixed(2)}%)
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => removeHolding(row.coinId)}
                          className="rounded bg-red-500 px-3 py-1 text-xs text-white"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Login to manage your portfolio.</p>
      )}
    </section>
  );
}
