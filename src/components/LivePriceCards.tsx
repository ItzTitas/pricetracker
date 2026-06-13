import React from 'react';
import { ArrowUpRight, ArrowDownRight, Globe, Coins, ShieldCheck, HelpCircle } from 'lucide-react';

interface LivePriceCardsProps {
  prices: any;
  currency: string;
  weight: string;
  goldPurity: string;
  location: string;
  onPurityChange: (purity: string) => void;
  statusText: string;
  timeSinceUpdate: number;
}

const PURITY_LABELS: Record<string, string> = {
  '24K': '24K (99.9%)',
  '22K': '22K (91.6%)',
  '20K': '20K (83.3%)',
  '18K': '18K (75.0%)'
};

const PURITY_MULTIPLIERS: Record<string, number> = {
  '24K': 1.0,
  '22K': 0.916,
  '20K': 0.833,
  '18K': 0.750
};

export default function LivePriceCards({
  prices,
  currency,
  weight,
  goldPurity,
  location,
  onPurityChange,
  statusText,
  timeSinceUpdate
}: LivePriceCardsProps) {
  if (!prices) return <div className="text-white text-center py-10">Loading live prices...</div>;

  const currencySymbol = currency === 'INR' ? '₹' : '$';
  
  // Calculate weight multiplier
  const getWeightMultiplier = () => {
    if (weight === '10g') return 10;
    if (weight === '1kg') return 1000;
    return 1;
  };

  const weightMult = getWeightMultiplier();
  const purityMult = PURITY_MULTIPLIERS[goldPurity];

  // Helper to format values
  const formatVal = (val: number) => {
    return val.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // 1. Gold Calculation
  const goldPriceGrams = prices.gold.current * purityMult;
  const goldDisplayPrice = goldPriceGrams * weightMult;
  const goldTrend = getTrend(prices.gold.history);

  // 2. Silver Calculation
  const silverPriceGrams = prices.silver.current;
  const silverDisplayPrice = silverPriceGrams * weightMult;
  const silverTrend = getTrend(prices.silver.history);

  // 3. Copper Calculation
  const copperPriceGrams = prices.copper.current;
  const copperDisplayPrice = copperPriceGrams * weightMult;
  const copperTrend = getTrend(prices.copper.history);

  function getTrend(history: number[]) {
    if (history.length < 2) return { isUp: true, pct: '0.00' };
    const latest = history[history.length - 1];
    const prev = history[history.length - 2];
    const pct = ((latest - prev) / prev) * 100;
    return {
      isUp: pct >= 0,
      pct: Math.abs(pct).toFixed(2)
    };
  }

  return (
    <div className="space-y-6">
      {/* Live Status and Indicator */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-semibold text-emerald-400">Live Market Feed</span>
          <span className="text-xs text-zinc-400 border-l border-zinc-700 pl-2">{statusText}</span>
        </div>
        <span className="text-xs text-zinc-500">
          Updated {timeSinceUpdate === 0 ? 'just now' : `${timeSinceUpdate} seconds ago`}
        </span>
      </div>

      {/* Grid of Commodity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gold Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/90 to-zinc-950 border border-amber-500/30 p-6 shadow-xl backdrop-blur-xl group hover:border-amber-500/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Precious Metal</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">Gold</h3>
            </div>
            
            {/* Purity Selector */}
            <select
              value={goldPurity}
              onChange={(e) => onPurityChange(e.target.value)}
              className="bg-zinc-800/80 text-amber-200 border border-amber-500/20 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-amber-400/50 transition-colors"
            >
              {Object.entries(PURITY_LABELS).map(([k, v]) => (
                <option key={k} value={k} className="bg-zinc-900 text-white">
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 space-y-1">
            <span className="text-xs text-zinc-400">Spot Price ({weight})</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-200">{currencySymbol}</span>
              <span className="text-4xl font-black text-white tracking-tight">{formatVal(goldDisplayPrice)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
            <span className="text-xs text-zinc-500 font-medium">Daily Change</span>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
              goldTrend.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {goldTrend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{goldTrend.isUp ? '+' : '-'}{goldTrend.pct}%</span>
            </div>
          </div>
        </div>

        {/* Silver Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-400/10 via-zinc-900/90 to-zinc-950 border border-zinc-700/50 p-6 shadow-xl backdrop-blur-xl group hover:border-zinc-500 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-400/5 rounded-full blur-2xl group-hover:bg-zinc-400/15 transition-all duration-500"></div>
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Precious Metal</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">Silver</h3>
            </div>
            <span className="text-xs bg-zinc-800/50 text-zinc-300 px-2 py-1 rounded-md border border-zinc-700/50">99.9% Standard</span>
          </div>

          <div className="mt-8 space-y-1">
            <span className="text-xs text-zinc-400">Spot Price ({weight})</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-zinc-300">{currencySymbol}</span>
              <span className="text-4xl font-black text-white tracking-tight">{formatVal(silverDisplayPrice)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
            <span className="text-xs text-zinc-500 font-medium">Daily Change</span>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
              silverTrend.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {silverTrend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{silverTrend.isUp ? '+' : '-'}{silverTrend.pct}%</span>
            </div>
          </div>
        </div>

        {/* Copper Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600/10 via-zinc-900/90 to-zinc-950 border border-orange-600/20 p-6 shadow-xl backdrop-blur-xl group hover:border-orange-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full blur-2xl group-hover:bg-orange-600/15 transition-all duration-500"></div>
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-semibold">Industrial Metal</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">Copper</h3>
            </div>
            <span className="text-xs bg-zinc-800/50 text-orange-200 px-2 py-1 rounded-md border border-orange-500/10">LME Grade A</span>
          </div>

          <div className="mt-8 space-y-1">
            <span className="text-xs text-zinc-400">Spot Price ({weight})</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-orange-300">{currencySymbol}</span>
              <span className="text-4xl font-black text-white tracking-tight">{formatVal(copperDisplayPrice)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
            <span className="text-xs text-zinc-500 font-medium">Daily Change</span>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
              copperTrend.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {copperTrend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{copperTrend.isUp ? '+' : '-'}{copperTrend.pct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
