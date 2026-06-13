import React, { useState, useEffect } from 'react';
import { Map, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface RegionalComparisonProps {
  currentCurrency: string;
  currentWeight: string;
  currentGoldPurity: string;
}

export default function RegionalComparison({
  currentCurrency,
  currentWeight,
  currentGoldPurity
}: RegionalComparisonProps) {
  const [metal, setMetal] = useState('gold');
  const [purity, setPurity] = useState(currentGoldPurity);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRegionalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        metal,
        currency: currentCurrency,
        ...(metal === 'gold' && { purity })
      });
      const res = await fetch(`/api/prices/compare-regions?${params}`);
      if (!res.ok) throw new Error('Failed to retrieve regional comparison');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegionalData();
  }, [metal, purity, currentCurrency, currentGoldPurity]);

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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Map className="text-indigo-500" size={20} />
          Regional Arbitrage Finder
        </h3>

        <div className="flex items-center gap-2">
          {/* Metal Select */}
          <select
            value={metal}
            onChange={(e) => setMetal(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-zinc-700 transition-colors"
          >
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="copper">Copper</option>
          </select>

          {/* Purity (Gold) */}
          {metal === 'gold' && (
            <select
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-zinc-700 transition-colors"
            >
              <option value="24K">24K</option>
              <option value="22K">22K</option>
              <option value="20K">20K</option>
              <option value="18K">18K</option>
            </select>
          )}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center items-center py-16">
          <RefreshCw className="animate-spin text-zinc-500" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-rose-400 uppercase">Highest Price</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className="text-xl font-extrabold text-white">
                  {formatPrice(data.highest.price * weightMult)}
                </span>
              </div>
              <span className="text-xs text-zinc-500 block mt-1">in {data.highest.city}</span>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-emerald-400 uppercase">Lowest Price</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className="text-xl font-extrabold text-white">
                  {formatPrice(data.lowest.price * weightMult)}
                </span>
              </div>
              <span className="text-xs text-zinc-500 block mt-1">in {data.lowest.city}</span>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-4">
              <span className="text-xs font-bold text-indigo-400 uppercase">Average Price</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-zinc-400">{currencySymbol}</span>
                <span className="text-xl font-extrabold text-white">
                  {formatPrice(data.average * weightMult)}
                </span>
              </div>
              <span className="text-xs text-zinc-500 block mt-1">across all cities</span>
            </div>
          </div>

          {/* List/Table */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-zinc-900/80 px-4 py-2.5 text-xs font-bold text-zinc-400 border-b border-zinc-800">
              <div>CITY</div>
              <div className="text-right">PRICE ({currentWeight})</div>
              <div className="text-right">VARIANCE (VS AVG)</div>
            </div>
            <div className="divide-y divide-zinc-850">
              {data.comparison.map((c: any) => {
                const diff = (c.price * weightMult) - (data.average * weightMult);
                const diffPct = (diff / (data.average * weightMult)) * 100;
                return (
                  <div key={c.city} className="grid grid-cols-3 px-4 py-3 text-sm text-white items-center">
                    <span className="font-semibold">{c.city}</span>
                    <span className="text-right font-medium">
                      {currencySymbol}{formatPrice(c.price * weightMult)}
                    </span>
                    <span className={`text-right font-semibold text-xs flex items-center justify-end gap-1 ${
                      diffPct >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {diffPct >= 0 ? '+' : ''}
                      {diffPct.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
