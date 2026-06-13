import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface AdvancedChartProps {
  currentLocation: string;
  currentCurrency: string;
  currentWeight: string;
  currentGoldPurity: string;
}

export default function AdvancedChart({
  currentLocation,
  currentCurrency,
  currentWeight,
  currentGoldPurity
}: AdvancedChartProps) {
  const [metal, setMetal] = useState('gold');
  const [purity, setPurity] = useState(currentGoldPurity);
  const [timeframe, setTimeframe] = useState('1M'); // 1D, 7D, 1M, 3M, 6M, 1Y, 5Y, MAX
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        metal,
        city: currentLocation,
        currency: currentCurrency,
        timeframe,
        ...(metal === 'gold' && { purity })
      });
      const res = await fetch(`/api/prices/chart?${params}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      const json = await res.json();
      setChartData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [metal, purity, timeframe, currentLocation, currentCurrency, currentGoldPurity]);

  const currencySymbol = currentCurrency === 'INR' ? '₹' : '$';

  const getWeightMultiplier = () => {
    if (currentWeight === '10g') return 10;
    if (currentWeight === '1kg') return 1000;
    return 1;
  };

  const weightMult = getWeightMultiplier();

  // Downsample/Map data with weight multiplier
  const processedData = chartData.map(d => ({
    ...d,
    price: Number((d.price * weightMult).toFixed(2))
  }));

  const formatPrice = (val: number) => {
    return val.toLocaleString(currentCurrency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getThemeColor = () => {
    if (metal === 'gold') return { stroke: '#fbbf24', fill: 'url(#colorGold)' };
    if (metal === 'silver') return { stroke: '#a1a1aa', fill: 'url(#colorSilver)' };
    return { stroke: '#ea580c', fill: 'url(#colorCopper)' };
  };

  const colors = getThemeColor();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 shadow-xl">
          <p className="text-xs font-bold text-zinc-500">{label}</p>
          <p className="text-sm font-black text-white mt-1">
            {currencySymbol}{formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-amber-500" size={20} />
          Advanced Historical Charts
        </h3>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={metal}
            onChange={(e) => setMetal(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-zinc-700 transition-colors"
          >
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="copper">Copper</option>
          </select>

          {metal === 'gold' && (
            <select
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-zinc-700 transition-colors"
            >
              <option value="24K">24K</option>
              <option value="22K">22K</option>
              <option value="20K">20K</option>
              <option value="18K">18K</option>
            </select>
          )}

          {/* Timeframe selector */}
          <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
            {['1D', '7D', '1M', '3M', '6M', '1Y', '5Y', 'MAX'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                  timeframe === tf ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && processedData.length === 0 ? (
        <div className="flex justify-center items-center h-[300px]">
          <RefreshCw className="animate-spin text-zinc-500" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      ) : (
        <div className="w-full h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSilver" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCopper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `${currencySymbol}${formatPrice(value).split('.')[0]}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={colors.stroke}
                fill={colors.fill}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
