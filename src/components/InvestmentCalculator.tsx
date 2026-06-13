import React, { useState } from 'react';
import { Calculator, ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp } from 'lucide-react';

interface InvestmentCalculatorProps {
  currentLocation: string;
  currentCurrency: string;
  currentWeight: string;
  currentGoldPurity: string;
}

export default function InvestmentCalculator({
  currentLocation,
  currentCurrency,
  currentWeight,
  currentGoldPurity
}: InvestmentCalculatorProps) {
  const [metal, setMetal] = useState('gold');
  const [purity, setPurity] = useState(currentGoldPurity);
  const [date, setDate] = useState('2021-01-01');
  const [amountInvested, setAmountInvested] = useState('50000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fetch historical price per gram on that date
      const params = new URLSearchParams({
        metal,
        city: currentLocation,
        currency: currentCurrency,
        date,
        ...(metal === 'gold' && { purity })
      });

      const res = await fetch(`/api/prices/historical?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch historical data');
      }

      const data = await res.json();

      // Amount Invested
      const principal = parseFloat(amountInvested);
      if (isNaN(principal) || principal <= 0) {
        throw new Error('Please enter a valid investment amount');
      }

      // Calculations:
      // Price is per 1g.
      const purchasePricePerGram = data.historicalPrice;
      const currentPricePerGram = data.currentPrice;

      // Weight bought = Amount Invested / purchasePricePerGram
      const weightBought = principal / purchasePricePerGram;

      // Current Value = weightBought * currentPricePerGram
      const currentValue = weightBought * currentPricePerGram;

      // Profit
      const profit = currentValue - principal;
      const pctReturn = (profit / principal) * 100;

      setResult({
        principal,
        purchasePricePerGram,
        currentPricePerGram,
        weightBought,
        currentValue,
        profit,
        pctReturn,
        date: data.date
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = currentCurrency === 'INR' ? '₹' : '$';

  const formatPrice = (val: number) => {
    return val.toLocaleString(currentCurrency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 shadow-xl backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Calculator className="text-emerald-500" size={20} />
        Investment Return Calculator
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Controls */}
        <form onSubmit={handleCalculate} className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Metal</label>
              <select
                value={metal}
                onChange={(e) => setMetal(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-700 transition-colors"
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="copper">Copper</option>
              </select>
            </div>

            <div className="space-y-1.5" style={{ opacity: metal === 'gold' ? 1 : 0.4 }}>
              <label className="text-xs font-bold text-zinc-400 uppercase">Purity</label>
              <select
                value={purity}
                disabled={metal !== 'gold'}
                onChange={(e) => setPurity(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-700 transition-colors disabled:opacity-50"
              >
                <option value="24K">24K (99.9%)</option>
                <option value="22K">22K (91.6%)</option>
                <option value="20K">20K (83.3%)</option>
                <option value="18K">18K (75.0%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Purchase Date</label>
              <input
                type="date"
                value={date}
                min="2021-06-14"
                max="2026-06-13"
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-700 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Amount Invested ({currencySymbol})</label>
              <input
                type="number"
                value={amountInvested}
                onChange={(e) => setAmountInvested(e.target.value)}
                placeholder="50000"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <TrendingUp size={16} />}
            Calculate Returns
          </button>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
              {error}
            </div>
          )}
        </form>

        {/* Visual Return Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-6">
          {result ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold">Total ROI</span>
                  <div className={`text-4xl font-extrabold flex items-center mt-1 ${result.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.profit >= 0 ? '+' : ''}
                    {result.pctReturn.toFixed(2)}%
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${result.profit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {result.profit >= 0 ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
                </div>
              </div>

              {/* Progress visual gain/loss indicator bar */}
              <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`absolute h-full rounded-full transition-all duration-1000 ${
                    result.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, result.pctReturn))}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-4 text-sm">
                <div>
                  <span className="text-zinc-500 block text-xs">Initial Investment</span>
                  <span className="font-bold text-white text-lg">{currencySymbol}{formatPrice(result.principal)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs">Current Value</span>
                  <span className="font-bold text-white text-lg">{currencySymbol}{formatPrice(result.currentValue)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs">Metal Acquired</span>
                  <span className="font-bold text-white text-lg">
                    {result.weightBought.toFixed(4)}g
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs">Net Profit</span>
                  <span className={`font-bold text-lg ${result.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currencySymbol}{formatPrice(result.profit)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-500 space-y-3">
              <Calculator size={48} className="text-zinc-700 animate-pulse" />
              <p className="text-sm max-w-sm">
                Enter your investment details on the left and hit calculate to view dynamic investment return statistics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
