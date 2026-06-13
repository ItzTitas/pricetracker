import React, { useState } from 'react';
import { Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

interface HistoricalLookupProps {
  currentLocation: string;
  currentCurrency: string;
  currentWeight: string;
  currentGoldPurity: string;
}

export default function HistoricalLookup({
  currentLocation,
  currentCurrency,
  currentWeight,
  currentGoldPurity
}: HistoricalLookupProps) {
  const [metal, setMetal] = useState('gold');
  const [date, setDate] = useState('2020-08-15');
  const [city, setCity] = useState(currentLocation);
  const [purity, setPurity] = useState(currentGoldPurity);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getWeightMultiplier = () => {
    if (currentWeight === '10g') return 10;
    if (currentWeight === '1kg') return 1000;
    return 1;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        metal,
        city,
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
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = currentCurrency === 'INR' ? '₹' : '$';
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
        <Calendar className="text-amber-500" size={20} />
        Historical Price Explorer
      </h3>

      <form onSubmit={handleLookup} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
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

        {/* Purity (for Gold) */}
        <div className="space-y-1.5" style={{ opacity: metal === 'gold' ? 1 : 0.4 }}>
          <label className="text-xs font-bold text-zinc-400 uppercase">Purity (Gold)</label>
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

        {/* Region */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase">Region / City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-700 transition-colors"
          >
            <option value="Kolkata">Kolkata, IN</option>
            <option value="Mumbai">Mumbai, IN</option>
            <option value="Delhi">Delhi, IN</option>
            <option value="Chennai">Chennai, IN</option>
            <option value="NewYork">New York, US</option>
            <option value="London">London, UK</option>
            <option value="Dubai">Dubai, UAE</option>
          </select>
        </div>

        {/* Date Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase">Date</label>
          <input
            type="date"
            value={date}
            min="2021-06-14"
            max="2026-06-13"
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            Query Price
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
            {/* Historical Price */}
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-zinc-500 uppercase">Price on {new Date(result.date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className="text-2xl font-black text-white">{formatPrice(result.historicalPrice * weightMult)}</span>
                <span className="text-xs text-zinc-500 ml-1">/ {currentWeight}</span>
              </div>
            </div>

            {/* Current Price */}
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-zinc-500 uppercase">Current Price</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className="text-2xl font-black text-white">{formatPrice(result.currentPrice * weightMult)}</span>
                <span className="text-xs text-zinc-500 ml-1">/ {currentWeight}</span>
              </div>
            </div>

            {/* Absolute Difference */}
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-zinc-500 uppercase">Absolute Change</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className={`text-2xl font-black ${result.absoluteDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.absoluteDifference >= 0 ? '+' : ''}{formatPrice(result.absoluteDifference * weightMult)}
                </span>
              </div>
            </div>

            {/* Growth Percentage */}
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-zinc-500 uppercase">Investment Return</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-2xl font-black flex items-center gap-1 ${result.percentageChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.percentageChange >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  {result.percentageChange >= 0 ? '+' : ''}{result.percentageChange.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
