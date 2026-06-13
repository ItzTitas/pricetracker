import React, { useState } from 'react';
import { ArrowLeftRight, RefreshCw, ArrowUpRight, ArrowDownRight, GitCompare } from 'lucide-react';

interface DateComparisonProps {
  currentLocation: string;
  currentCurrency: string;
  currentWeight: string;
  currentGoldPurity: string;
}

export default function DateComparison({
  currentLocation,
  currentCurrency,
  currentWeight,
  currentGoldPurity
}: DateComparisonProps) {
  const [metal, setMetal] = useState('gold');
  const [purity, setPurity] = useState(currentGoldPurity);
  const [dateA, setDateA] = useState('2021-08-15');
  const [dateB, setDateB] = useState('2026-06-13');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const getParams = (date: string) => {
        return new URLSearchParams({
          metal,
          city: currentLocation,
          currency: currentCurrency,
          date,
          ...(metal === 'gold' && { purity })
        });
      };

      const [resA, resB] = await Promise.all([
        fetch(`/api/prices/historical?${getParams(dateA)}`),
        fetch(`/api/prices/historical?${getParams(dateB)}`)
      ]);

      if (!resA.ok || !resB.ok) {
        throw new Error('Failed to fetch historical prices for comparison');
      }

      const dataA = await resA.json();
      const dataB = await resB.json();

      const priceA = dataA.historicalPrice;
      const priceB = dataB.historicalPrice;
      const difference = priceB - priceA;
      const pctChange = (difference / priceA) * 105; // Growth percentage

      setResult({
        dateA: dataA.date,
        priceA,
        dateB: dataB.date,
        priceB,
        difference,
        pctChange
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = currentCurrency === 'INR' ? '₹' : '$';

  const getWeightMultiplier = () => {
    if (currentWeight === '10g') return 10;
    if (currentWeight === '1kg') return 1000;
    return 1;
  };

  const weightMult = getWeightMultiplier();

  const formatPrice = (val: number) => {
    return val.toLocaleString(currentCurrency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 shadow-xl backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <GitCompare className="text-orange-500" size={20} />
        Date Comparison Tool
      </h3>

      <form onSubmit={handleCompare} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
        {/* Metal */}
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

        {/* Purity (Gold) */}
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

        {/* Date A */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase">Date A</label>
          <input
            type="date"
            value={dateA}
            min="2021-06-14"
            max="2026-06-13"
            onChange={(e) => setDateA(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Date B */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase">Date B</label>
          <input
            type="date"
            value={dateB}
            min="2021-06-14"
            max="2026-06-13"
            onChange={(e) => setDateB(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-zinc-950 font-black text-sm py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <ArrowLeftRight size={16} />}
            Compare Dates
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 border-t border-zinc-800/80 pt-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Price A */}
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-zinc-500 uppercase">Price on Date A</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className="text-2xl font-black text-white">{formatPrice(result.priceA * weightMult)}</span>
              </div>
              <span className="text-xs text-zinc-500 block mt-1">({new Date(result.dateA).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })})</span>
            </div>

            {/* Price B */}
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-zinc-500 uppercase">Price on Date B</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className="text-2xl font-black text-white">{formatPrice(result.priceB * weightMult)}</span>
              </div>
              <span className="text-xs text-zinc-500 block mt-1">({new Date(result.dateB).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })})</span>
            </div>

            {/* Difference */}
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-zinc-500 uppercase">Difference</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className={`text-2xl font-black ${result.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.difference >= 0 ? '+' : ''}{formatPrice(result.difference * weightMult)}
                </span>
              </div>
            </div>

            {/* Growth */}
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-zinc-500 uppercase">Growth %</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-2xl font-black flex items-center gap-1 ${result.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.difference >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  {result.difference >= 0 ? '+' : ''}{result.pctChange.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
