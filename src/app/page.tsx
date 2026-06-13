'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  TrendingUp, Scale, MapPin, DollarSign, Calendar, Search, 
  Trash2, Edit3, Plus, AlertCircle, RefreshCw, Eye, 
  GitCompare, Calculator, Map, PlusCircle, CheckCircle, 
  LogOut, LogIn, Sparkles, Gem, BarChart3, Bell, ChevronDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Logo from '@/components/Logo';

// Config & Multipliers
const CITIES = ['Kolkata', 'Mumbai', 'Delhi', 'Chennai', 'NewYork', 'London', 'Dubai'];
const PURITIES = ['24K', '22K', '20K', '18K'];

const LOCATION_MULTIPLIERS: Record<string, number> = {
  'Kolkata': 1.1845,
  'Mumbai': 1.1920,
  'Delhi': 1.1810,
  'Chennai': 1.1870,
  'NewYork': 1.0000,
  'London': 1.0100,
  'Dubai': 1.0500
};

const PURITY_MULTIPLIERS: Record<string, number> = {
  '24K': 1.0,
  '22K': 0.916,
  '20K': 0.833,
  '18K': 0.750
};

export default function AurumTrackDashboard() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Global filters
  const [location, setLocation] = useState('Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [weight, setWeight] = useState('10g');

  // Live feeds
  const [livePrices, setLivePrices] = useState<any>(null);
  const [tickerTime, setTickerTime] = useState(0);
  const [feedStatus, setFeedStatus] = useState('Loading live tickers...');

  // Active section tabs (for Auth users)
  const [activeTab, setActiveTab] = useState('overview'); // overview, holdings, analytics, simulator, tools

  // Forms / Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [metalType, setMetalType] = useState('gold');
  const [itemPurity, setItemPurity] = useState('24K');
  const [itemWeight, setItemWeight] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('2024-01-01');
  const [purchaseCity, setPurchaseCity] = useState('Kolkata');
  const [isJewelry, setIsJewelry] = useState(false);
  const [jewelryType, setJewelryType] = useState('Necklace');
  const [itemName, setItemName] = useState('');
  const [holdingNotes, setHoldingNotes] = useState('');
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);

  // Local state for portfolio holdings, charts, watchlists, alerts
  const [holdings, setHoldings] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  
  // Lookup states
  const [lookupMetal, setLookupMetal] = useState('gold');
  const [lookupDate, setLookupDate] = useState('2022-08-15');
  const [lookupPurity, setLookupPurity] = useState('24K');
  const [lookupCity, setLookupCity] = useState('Kolkata');
  const [lookupResult, setLookupResult] = useState<any>(null);

  // Simulator states
  const [simMetal, setSimMetal] = useState('gold');
  const [simDate, setSimDate] = useState('2021-01-01');
  const [simAmount, setSimAmount] = useState('50000');
  const [simResult, setSimResult] = useState<any>(null);

  // Date Comparison states
  const [compMetal, setCompMetal] = useState('gold');
  const [compPurity, setCompPurity] = useState('24K');
  const [compDateA, setCompDateA] = useState('2021-08-15');
  const [compDateB, setCompDateB] = useState('2026-06-13');
  const [compResult, setCompResult] = useState<any>(null);

  // Expanded metal card states for public homepage
  const [expandedMetal, setExpandedMetal] = useState<string | null>(null);
  const [goldPurity, setGoldPurity] = useState('24K');
  const [goldChartTimeframe, setGoldChartTimeframe] = useState('7D');
  const [silverChartTimeframe, setSilverChartTimeframe] = useState('7D');
  const [loadingChart, setLoadingChart] = useState(false);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Custom Dropdown states
  const [isPurityOpen, setIsPurityOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [isAddMetalOpen, setIsAddMetalOpen] = useState(false);
  const [isAddPurityOpen, setIsAddPurityOpen] = useState(false);
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [isAddJewelryTypeOpen, setIsAddJewelryTypeOpen] = useState(false);


  // User Profile & Notification states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [weeklyNotify, setWeeklyNotify] = useState(false);
  const [hasGoogleClient, setHasGoogleClient] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isAlertMetalOpen, setIsAlertMetalOpen] = useState(false);
  const [isAlertConditionOpen, setIsAlertConditionOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/check-google')
      .then(res => res.json())
      .then(data => setHasGoogleClient(data.configured))
      .catch(() => setHasGoogleClient(false));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('weeklyNotify');
    if (saved) {
      setWeeklyNotify(saved === 'true');
    }
  }, []);

  const handleWeeklyNotifyToggle = (val: boolean) => {
    setWeeklyNotify(val);
    localStorage.setItem('weeklyNotify', val.toString());
    if (val && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (!weeklyNotify || !livePrices) return;
    const checkWeeklyLow = async () => {
      try {
        const res = await fetch(`/api/prices/weekly-low?city=${location}&currency=${currency}`);
        if (res.ok) {
          const data = await res.json();
          const todayStr = new Date().toISOString().split('T')[0];
          const notifiedKey = `notifiedLow_${location}_${currency}_${todayStr}`;
          
          if (localStorage.getItem(notifiedKey)) return;

          if (data.gold.isWeeklyLow || data.silver.isWeeklyLow) {
            const sym = currency === 'INR' ? '₹' : '$';
            const fmt = (v: number) => v.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            let message = '';
            if (data.gold.isWeeklyLow && data.silver.isWeeklyLow) {
              message = `Gold and Silver hit new weekly lows in ${location}!`;
            } else if (data.gold.isWeeklyLow) {
              message = `Gold hit a weekly low of ${sym}${fmt(data.gold.weeklyMin || 0)} in ${location}!`;
            } else {
              message = `Silver hit a weekly low of ${sym}${fmt(data.silver.weeklyMin || 0)} in ${location}!`;
            }

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('aurumtrack Weekly Low Alert', { body: message });
            } else {
              alert(`🚨 aurumtrack Alert: ${message}`);
            }
            localStorage.setItem(notifiedKey, 'true');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkWeeklyLow();
  }, [weeklyNotify, livePrices, location, currency]);

  // Alert Rule states
  const [newAlertMetal, setNewAlertMetal] = useState('gold');
  const [newAlertPurity, setNewAlertPurity] = useState('24K');
  const [newAlertCondition, setNewAlertCondition] = useState('ABOVE');
  const [newAlertTarget, setNewAlertTarget] = useState('');

  // Watchlist addition
  const [watchMetal, setWatchMetal] = useState('gold');
  const [watchPurity, setWatchPurity] = useState('24K');
  const [watchCity, setWatchCity] = useState('Kolkata');

  // Load functions
  const fetchLiveFeeds = async () => {
    try {
      const res = await fetch('/api/prices/live');
      if (!res.ok) throw new Error('Live stream offline');
      const data = await res.json();
      
      const locMult = LOCATION_MULTIPLIERS[location] || 1.0;
      const exRate = data.exchange_rate || 83.5;

      const adjust = (valUSD: number) => {
        let price = valUSD * locMult;
        if (currency === 'INR') price *= exRate;
        return price;
      };

      setLivePrices({
        gold: {
          current: adjust(data.prices.gold.current),
          history: data.prices.gold.history.map(adjust)
        },
        silver: {
          current: adjust(data.prices.silver.current),
          history: data.prices.silver.history.map(adjust)
        }
      });
      setTickerTime(0);
      setFeedStatus(data.is_mock ? 'Seeded Fallback Feed' : 'Direct API Stream');
    } catch (err) {
      setFeedStatus('Simulating Live Market Tickers');
    }
  };

  const loadHoldings = async () => {
    try {
      const res = await fetch('/api/holdings');
      if (res.ok) {
        const data = await res.json();
        setHoldings(data);
      }
    } catch (e) { console.error(e); }
  };

  const loadTimeline = async () => {
    try {
      const res = await fetch('/api/portfolio/wealth-reconstruct');
      if (res.ok) {
        const data = await res.json();
        setTimelineData(data.timeline);
      }
    } catch (e) { console.error(e); }
  };

  const loadWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlists');
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data);
      }
    } catch (e) { console.error(e); }
  };

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchLiveFeeds();
    const interval = setInterval(() => fetchLiveFeeds(), 60000);
    return () => clearInterval(interval);
  }, [location, currency]);

  // Fetch chart data for unauthenticated expandable cards or active overview dashboard
  const [goldChartData, setGoldChartData] = useState<any[]>([]);
  const [silverChartData, setSilverChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchOverviewCharts = async () => {
      try {
        let tfGold = '7D';
        if (goldChartTimeframe === '1D') tfGold = '1D';
        if (goldChartTimeframe === '2W') tfGold = '7D';
        if (goldChartTimeframe === '30D') tfGold = '1M';

        let tfSilver = '7D';
        if (silverChartTimeframe === '1D') tfSilver = '1D';
        if (silverChartTimeframe === '2W') tfSilver = '7D';
        if (silverChartTimeframe === '30D') tfSilver = '1M';

        // Fetch Gold
        const goldParams = new URLSearchParams({
          metal: 'gold',
          city: location,
          currency,
          timeframe: tfGold,
          purity: goldPurity
        });
        const gRes = await fetch(`/api/prices/chart?${goldParams}`);
        if (gRes.ok) {
          const gData = await gRes.json();
          setGoldChartData(gData.data);
        }

        // Fetch Silver
        const silverParams = new URLSearchParams({
          metal: 'silver',
          city: location,
          currency,
          timeframe: tfSilver
        });
        const sRes = await fetch(`/api/prices/chart?${silverParams}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          setSilverChartData(sData.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (activeTab === 'overview' || expandedMetal) {
      fetchOverviewCharts();
    }
  }, [activeTab, expandedMetal, goldChartTimeframe, silverChartTimeframe, location, currency, goldPurity]);

  // Dynamic historical price recommendation
  useEffect(() => {
    const fetchRecommendedPrice = async () => {
      if (!purchaseDate || !purchaseCity || !metalType) {
        setRecommendedPrice(null);
        return;
      }
      try {
        const params = new URLSearchParams({
          metal: metalType,
          city: purchaseCity,
          currency,
          date: purchaseDate,
          ...(metalType === 'gold' && { purity: itemPurity })
        });
        const res = await fetch(`/api/prices/historical?${params}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendedPrice(data.historicalPrice);
        } else {
          setRecommendedPrice(null);
        }
      } catch (err) {
        setRecommendedPrice(null);
      }
    };
    fetchRecommendedPrice();
  }, [metalType, itemPurity, purchaseDate, purchaseCity, currency]);

  useEffect(() => {
    const ticker = setInterval(() => setTickerTime(t => t + 1), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadHoldings();
      loadTimeline();
      loadWatchlist();
      loadAlerts();
    }
  }, [isAuthenticated]);

  // Form Submissions
  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const jewelryItems = isJewelry ? [{
        itemName: itemName || jewelryType,
        jewelryType,
        weight: parseFloat(itemWeight),
        purity: metalType === 'gold' ? itemPurity : '999',
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        notes: holdingNotes
      }] : [];

      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metal: metalType,
          purity: metalType === 'gold' ? itemPurity : '999',
          weight: parseFloat(itemWeight),
          purchaseDate,
          purchasePrice: parseFloat(purchasePrice) || 0,
          purchaseCity,
          notes: holdingNotes,
          jewelryItems
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        // Clear inputs
        setItemWeight('');
        setPurchasePrice('');
        setHoldingNotes('');
        setItemName('');
        setIsJewelry(false);

        // Reload data
        loadHoldings();
        loadTimeline();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteHolding = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Holding',
      message: 'Are you sure you want to delete this holding? This action cannot be undone and will permanently remove this asset from your portfolio.',
      onConfirm: async () => {
        await fetch(`/api/holdings/${id}`, { method: 'DELETE' });
        loadHoldings();
        loadTimeline();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteAccount = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Account Permanently',
      message: 'WARNING: Are you sure you want to delete your account? This action is permanent and will delete all holdings, watchlists, and alerts. This cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/user/delete', { method: 'POST' });
          if (res.ok) {
            signOut({ callbackUrl: '/' });
          } else {
            alert('Failed to delete account. Please try again.');
          }
        } catch (err) {
          console.error(err);
          alert('An error occurred. Please try again.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTarget) return;
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metal: newAlertMetal,
        purity: newAlertMetal === 'gold' ? newAlertPurity : '999',
        condition: newAlertCondition,
        targetPrice: parseFloat(newAlertTarget)
      })
    });
    if (res.ok) {
      setNewAlertTarget('');
      loadAlerts();
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };


  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/watchlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metal: watchMetal,
        purity: watchMetal === 'gold' ? watchPurity : null,
        city: watchCity
      })
    });
    if (res.ok) {
      loadWatchlist();
    }
  };

  // Calculations
  const getWeightMult = () => {
    if (weight === '10g') return 10;
    if (weight === '100g') return 100;
    if (weight === '1kg') return 1000;
    return 1;
  };

  const weightMult = getWeightMult();
  const currSymbol = currency === 'INR' ? '₹' : '$';

  const formatPrice = (val: number) => {
    return val.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Reconstruct portfolio metrics in real-time
  const getPortfolioSummary = () => {
    let invested = 0;
    let currentVal = 0;
    let goldWeight = 0;
    let silverWeight = 0;
    let goldVal = 0;
    let silverVal = 0;

    holdings.forEach(h => {
      const principal = h.weight * h.purchasePrice;
      invested += principal;

      // Current spot price
      let spotPrice = 0;
      if (livePrices) {
        const base = h.metal === 'gold' ? livePrices.gold.current : livePrices.silver.current;
        // Adjust for purity if gold
        if (h.metal === 'gold') {
          const purityMult = PURITY_MULTIPLIERS[h.purity] || 1.0;
          spotPrice = base * purityMult;
        } else {
          spotPrice = base;
        }
      } else {
        spotPrice = h.purchasePrice; // fallback
      }

      const currentHoldingVal = h.weight * spotPrice;
      currentVal += currentHoldingVal;

      if (h.metal === 'gold') {
        goldWeight += h.weight;
        goldVal += currentHoldingVal;
      } else {
        silverWeight += h.weight;
        silverVal += currentHoldingVal;
      }
    });

    const profit = currentVal - invested;
    const roi = invested > 0 ? (profit / invested) * 100 : 0;

    return {
      invested,
      currentVal,
      profit,
      roi,
      goldWeight,
      silverWeight,
      goldVal,
      silverVal
    };
  };

  const summary = getPortfolioSummary();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      metal: lookupMetal,
      city: lookupCity,
      currency,
      date: lookupDate,
      ...(lookupMetal === 'gold' && { purity: lookupPurity })
    });
    const res = await fetch(`/api/prices/historical?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLookupResult(data);
    }
  };

  const handleSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      metal: simMetal,
      city: location,
      currency,
      date: simDate,
      purity: '24K'
    });
    const res = await fetch(`/api/prices/historical?${params}`);
    if (res.ok) {
      const data = await res.json();
      const principal = parseFloat(simAmount);
      const units = principal / data.historicalPrice;
      const currentVal = units * data.currentPrice;
      const profit = currentVal - principal;
      const pctReturn = (profit / principal) * 100;
      
      // CAGR
      const years = (new Date('2026-06-13').getTime() - new Date(simDate).getTime()) / (1000 * 3600 * 24 * 365);
      const cagr = (Math.pow(currentVal / principal, 1 / years) - 1) * 100;

      setSimResult({
        principal,
        units,
        currentVal,
        profit,
        pctReturn,
        cagr,
        historicalDate: data.date
      });
    }
  };

  const handleDateCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = (d: string) => new URLSearchParams({
      metal: compMetal,
      city: location,
      currency,
      date: d,
      purity: compPurity
    });

    const [resA, resB] = await Promise.all([
      fetch(`/api/prices/historical?${params(compDateA)}`),
      fetch(`/api/prices/historical?${params(compDateB)}`)
    ]);

    if (resA.ok && resB.ok) {
      const dataA = await resA.json();
      const dataB = await resB.json();
      const diff = dataB.historicalPrice - dataA.historicalPrice;
      const pct = (diff / dataA.historicalPrice) * 100;

      setCompResult({
        priceA: dataA.historicalPrice,
        priceB: dataB.historicalPrice,
        diff,
        pct,
        dateA: dataA.date,
        dateB: dataB.date
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      
      {/* Top Banner Navigation */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-zinc-50/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] border-none' 
          : 'bg-transparent border-none'
      }`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center">
          {isAuthenticated ? <Logo iconSize={26} textSize="text-xl" /> : <div />}
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">

        {/* PUBLIC HOMEPAGE */}
        {!isAuthenticated && (
          <div className="space-y-12">
            
            {/* Hero CTA */}
            <div className="text-center max-w-3xl mx-auto space-y-6 py-10 flex flex-col items-center">
              <Logo textSize="text-6xl sm:text-7xl" className="flex justify-center mb-2 animate-scaleUp" />
              <p className="text-zinc-600 text-sm sm:text-base max-w-xl mx-auto">
                Stop managing physical precious metals in spreadsheets. Track inherited jewelry, record legacy bullion, and monitor growth against live spot rates on <span className="font-bold text-amber-500">aurumtrack</span>.
              </p>
              
              <div className="pt-2 flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (hasGoogleClient) {
                        signIn('google', { callbackUrl: '/' });
                      } else {
                        signIn('credentials', { 
                          email: 'titasojha13@gmail.com', 
                          name: 'Titas Ojha', 
                          image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
                          callbackUrl: '/' 
                        });
                      }
                    }}
                    className="bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 font-extrabold text-sm px-5 py-2.5 rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Sign in with Google
                  </button>
                  <button
                    onClick={() => signIn('credentials', { email: 'titas@aurumtrack.com', callbackUrl: '/' })}
                    className="bg-zinc-950 hover:bg-zinc-900 text-white font-extrabold text-sm px-6 py-2.5 rounded-full shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Demo Access
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 mt-2">
                  {/* Custom Currency Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCurrencyOpen(!isCurrencyOpen);
                        setIsLocationOpen(false);
                        setIsMeasurementOpen(false);
                      }}
                      className="bg-zinc-100 hover:bg-zinc-150 border border-zinc-200/50 rounded-full px-5 py-2 text-sm font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer transition-colors shadow-sm"
                    >
                      {currency === 'INR' ? '₹ INR' : '$ USD'}
                      <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCurrencyOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsCurrencyOpen(false)} />
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-32 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 animate-scaleUp">
                          {['INR', 'USD'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setCurrency(c);
                                setIsCurrencyOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-zinc-50 transition-colors ${
                                currency === c ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {c === 'INR' ? '₹ INR' : '$ USD'}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom Location Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLocationOpen(!isLocationOpen);
                        setIsCurrencyOpen(false);
                        setIsMeasurementOpen(false);
                      }}
                      className="bg-zinc-100 hover:bg-zinc-150 border border-zinc-200/50 rounded-full px-5 py-2 text-sm font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer transition-colors shadow-sm"
                    >
                      {location}
                      <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isLocationOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLocationOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsLocationOpen(false)} />
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-36 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-60 overflow-y-auto animate-scaleUp">
                          {CITIES.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setLocation(c);
                                setIsLocationOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-zinc-50 transition-colors ${
                                location === c ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom Measurement Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMeasurementOpen(!isMeasurementOpen);
                        setIsCurrencyOpen(false);
                        setIsLocationOpen(false);
                      }}
                      className="bg-zinc-100 hover:bg-zinc-150 border border-zinc-200/50 rounded-full px-5 py-2 text-sm font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer transition-colors shadow-sm"
                    >
                      {weight}
                      <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isMeasurementOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMeasurementOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsMeasurementOpen(false)} />
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-32 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 animate-scaleUp">
                          {['1g', '10g', '100g', '1kg'].map(w => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => {
                                setWeight(w);
                                setIsMeasurementOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-zinc-50 transition-colors ${
                                weight === w ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Spot Cards (Interactive/Expandable Layout) */}
            {livePrices && (
              <div className="max-w-xl mx-auto space-y-6">
                
                {/* 1. Gold Card */}
                <div className="bg-white border border-zinc-200/80 text-zinc-900 rounded-[28px] p-6 shadow-sm relative overflow-hidden transition-all duration-350">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-zinc-900">Gold</h3>
                      <div className="flex items-center gap-1.5 mt-2 bg-amber-500/10 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit border border-amber-500/20">
                        <span>↑ 3.05%</span>
                      </div>
                    </div>

                    {/* Custom Purity Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsPurityOpen(!isPurityOpen)}
                        className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 outline-none cursor-pointer transition-colors"
                      >
                        {goldPurity}
                        <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-200 ${isPurityOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isPurityOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsPurityOpen(false)} />
                          <div className="absolute right-0 mt-1.5 w-32 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 animate-scaleUp">
                            {PURITIES.map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  setGoldPurity(p);
                                  setIsPurityOpen(false);
                                }}
                                className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                  goldPurity === p ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-zinc-400">{currSymbol}</span>
                    <span className="text-4xl font-black tracking-tight text-zinc-900">{formatPrice(livePrices.gold.current * weightMult * (PURITY_MULTIPLIERS[goldPurity] || 1.0))}</span>
                    <span className="text-xs text-zinc-500 ml-1">/ {weight}</span>
                  </div>

                  <div className="mt-6 border-t border-zinc-100 pt-4 text-center">
                    <button
                      onClick={() => setExpandedMetal(expandedMetal === 'gold' ? null : 'gold')}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold px-4 py-1.5 rounded-full cursor-pointer transition-colors"
                    >
                      {expandedMetal === 'gold' ? 'Hide Trend' : 'Tap for Trend Options'}
                    </button>
                  </div>

                  {/* Expanded chart inside Gold Card */}
                  {expandedMetal === 'gold' && (
                    <div className="mt-6 space-y-4 animate-fadeIn">
                      <div className="flex justify-center gap-1">
                        {['1D', '7D', '2W', '30D'].map(tf => (
                          <button
                            key={tf}
                            onClick={() => setGoldChartTimeframe(tf)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                              goldChartTimeframe === tf ? 'bg-amber-500 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                            }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>

                      <div className="h-[180px] w-full">
                        {loadingChart ? (
                          <div className="flex justify-center items-center h-full">
                            <RefreshCw className="animate-spin text-zinc-400" size={20} />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={goldChartData.map(d => ({ ...d, price: d.price * weightMult }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorGoldCard" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="label" stroke="#a1a1aa" fontSize={8} tickLine={false} />
                              <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} domain={['auto', 'auto']} />
                              <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e4e7', color: '#18181b', borderRadius: '12px', fontSize: '12px' }} />
                              <Area type="monotone" dataKey="price" stroke="#d97706" fill="url(#colorGoldCard)" strokeWidth={2} dot={true} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Silver Card */}
                <div className="bg-white border border-zinc-200/80 text-zinc-900 rounded-[28px] p-6 shadow-sm relative overflow-hidden transition-all duration-350">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-zinc-900">Silver</h3>
                      <div className="flex items-center gap-1.5 mt-2 bg-zinc-500/10 text-zinc-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit border border-zinc-500/20">
                        <span>↑ 6.22%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-zinc-400">{currSymbol}</span>
                    <span className="text-4xl font-black tracking-tight text-zinc-900">{formatPrice(livePrices.silver.current * weightMult)}</span>
                    <span className="text-xs text-zinc-500 ml-1">/ {weight}</span>
                  </div>

                  <div className="mt-6 border-t border-zinc-100 pt-4 text-center">
                    <button
                      onClick={() => setExpandedMetal(expandedMetal === 'silver' ? null : 'silver')}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold px-4 py-1.5 rounded-full cursor-pointer transition-colors"
                    >
                      {expandedMetal === 'silver' ? 'Hide Trend' : 'Tap for Trend Options'}
                    </button>
                  </div>

                  {/* Expanded chart inside Silver Card */}
                  {expandedMetal === 'silver' && (
                    <div className="mt-6 space-y-4 animate-fadeIn">
                      <div className="flex justify-center gap-1">
                        {['1D', '7D', '2W', '30D'].map(tf => (
                          <button
                            key={tf}
                            onClick={() => setSilverChartTimeframe(tf)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                              silverChartTimeframe === tf ? 'bg-zinc-700 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                            }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>

                      <div className="h-[180px] w-full">
                        {loadingChart ? (
                          <div className="flex justify-center items-center h-full">
                            <RefreshCw className="animate-spin text-zinc-400" size={20} />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={silverChartData.map(d => ({ ...d, price: d.price * weightMult }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSilverCard" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#71717a" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="label" stroke="#a1a1aa" fontSize={8} tickLine={false} />
                              <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} domain={['auto', 'auto']} />
                              <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e4e7', color: '#18181b', borderRadius: '12px', fontSize: '12px' }} />
                              <Area type="monotone" dataKey="price" stroke="#71717a" fill="url(#colorSilverCard)" strokeWidth={2} dot={true} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Source Notice */}
                  <div className="text-center pt-2">
                    <p className="text-[10px] text-zinc-400 font-medium">
                      Live spot rates are fetched in real-time from <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-bold">Yahoo Finance</a> (<code>GC=F</code> / <code>SI=F</code>) and adjusted for regional markets.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* AUTHENTICATED PORTFOLIO DASHBOARD */}
        {isAuthenticated && (
          <div className="space-y-6">
            
            {/* Dashboard Navigation Tabs */}
            <div className="flex gap-2 bg-zinc-200/50 p-1.5 rounded-full w-fit max-w-full overflow-hidden mx-auto">
              {['overview', 'holdings', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-extrabold rounded-full transition-all cursor-pointer uppercase tracking-wider ${
                    activeTab === tab ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-650 hover:text-zinc-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>


            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Portfolio Wealth Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Current Portfolio Value Card */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 p-6 rounded-3xl shadow-lg">
                    <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">Portfolio Valuation</span>
                    <h3 className="text-3xl font-black tracking-tight mt-1">
                      {currSymbol}{formatPrice(summary.currentVal)}
                    </h3>
                    <div className="mt-4 flex items-center gap-1.5">
                      <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp size={12} />
                        +{summary.roi.toFixed(2)}% ROI
                      </span>
                    </div>
                  </div>

                  {/* Invested Principal */}
                  <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Invested</span>
                      <h3 className="text-2xl font-black tracking-tight mt-1 text-zinc-950">
                        {currSymbol}{formatPrice(summary.invested)}
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-500 mt-4 font-semibold">Across physical purchases</span>
                  </div>

                  {/* Total Net Profit */}
                  <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Unrealized Profit</span>
                      <h3 className={`text-2xl font-black tracking-tight mt-1 ${
                        summary.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {currSymbol}{formatPrice(summary.profit)}
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-500 mt-4 font-semibold">Net gains over lifetime</span>
                  </div>
                </div>

                {/* Live Spot Price Tiles Grid */}
                {livePrices && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. Gold Card */}
                    <div className="bg-white border border-zinc-200 text-zinc-900 rounded-[28px] p-6 shadow-sm relative overflow-hidden transition-all duration-350">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-zinc-900">Gold</h3>
                          <div className="flex items-center gap-1.5 mt-2 bg-amber-500/10 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit border border-amber-500/20">
                            <span>↑ 3.05%</span>
                          </div>
                        </div>

                        {/* Custom Purity Selector */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsPurityOpen(!isPurityOpen)}
                            className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 outline-none cursor-pointer transition-colors"
                          >
                            {goldPurity}
                            <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-200 ${isPurityOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isPurityOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setIsPurityOpen(false)} />
                              <div className="absolute right-0 mt-1.5 w-32 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 animate-scaleUp">
                                {PURITIES.map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => {
                                      setGoldPurity(p);
                                      setIsPurityOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                      goldPurity === p ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-zinc-400">{currSymbol}</span>
                        <span className="text-4xl font-black tracking-tight text-zinc-900">{formatPrice(livePrices.gold.current * weightMult * (PURITY_MULTIPLIERS[goldPurity] || 1.0))}</span>
                        <span className="text-xs text-zinc-500 ml-1">/ {weight}</span>
                      </div>

                      {/* Always visible Trend Options & Chart */}
                      <div className="mt-6 border-t border-zinc-100 pt-4 space-y-4">
                        <div className="flex justify-center gap-1">
                          {['1D', '7D', '2W', '30D'].map(tf => (
                            <button
                              key={tf}
                              onClick={() => setGoldChartTimeframe(tf)}
                              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                                goldChartTimeframe === tf ? 'bg-amber-500 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              {tf}
                            </button>
                          ))}
                        </div>

                        <div className="h-[180px] w-full">
                          {goldChartData.length === 0 ? (
                            <div className="flex justify-center items-center h-full">
                              <RefreshCw className="animate-spin text-zinc-400" size={20} />
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={goldChartData.map(d => ({ ...d, price: d.price * weightMult }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorGoldCard" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="label" stroke="#a1a1aa" fontSize={8} tickLine={false} />
                                <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e4e7', color: '#18181b', borderRadius: '12px', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="price" stroke="#d97706" fill="url(#colorGoldCard)" strokeWidth={2} dot={true} />
                              </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Silver Card */}
                    <div className="bg-white border border-zinc-200 text-zinc-900 rounded-[28px] p-6 shadow-sm relative overflow-hidden transition-all duration-350">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-zinc-900">Silver</h3>
                          <div className="flex items-center gap-1.5 mt-2 bg-zinc-500/10 text-zinc-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit border border-zinc-500/20">
                            <span>↑ 6.22%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-zinc-400">{currSymbol}</span>
                        <span className="text-4xl font-black tracking-tight text-zinc-900">{formatPrice(livePrices.silver.current * weightMult)}</span>
                        <span className="text-xs text-zinc-500 ml-1">/ {weight}</span>
                      </div>

                      {/* Always visible Trend Options & Chart */}
                      <div className="mt-6 border-t border-zinc-100 pt-4 space-y-4">
                        <div className="flex justify-center gap-1">
                          {['1D', '7D', '2W', '30D'].map(tf => (
                            <button
                              key={tf}
                              onClick={() => setSilverChartTimeframe(tf)}
                              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                                silverChartTimeframe === tf ? 'bg-zinc-700 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              {tf}
                            </button>
                          ))}
                        </div>

                        <div className="h-[180px] w-full">
                          {silverChartData.length === 0 ? (
                            <div className="flex justify-center items-center h-full">
                              <RefreshCw className="animate-spin text-zinc-400" size={20} />
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={silverChartData.map(d => ({ ...d, price: d.price * weightMult }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorSilverCard" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="label" stroke="#a1a1aa" fontSize={8} tickLine={false} />
                                <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e4e7', color: '#18181b', borderRadius: '12px', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="price" stroke="#71717a" fill="url(#colorSilverCard)" strokeWidth={2} dot={true} />
                              </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Source Notice */}
                    <div className="text-center pt-2 lg:col-span-2">
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Live spot rates are fetched in real-time from <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-bold">Yahoo Finance</a> (<code>GC=F</code> / <code>SI=F</code>) and adjusted for regional markets.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: HOLDINGS */}
            {activeTab === 'holdings' && (
              <div className="space-y-6">
                
                {/* Recharts Portfolio Growth Timeline (Moved to Holdings) */}
                {timelineData.length > 0 ? (
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-amber-500" size={18} />
                        Wealth Reconstructed Performance Curve
                      </h3>
                    </div>
                    <div className="w-full h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timelineData}>
                          <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d97706" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                          <XAxis dataKey="label" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke="#d97706" fill="url(#colorVal)" strokeWidth={2.5} name="Portfolio Value" />
                          <Area type="monotone" dataKey="invested" stroke="#a1a1aa" fill="none" strokeWidth={1.5} name="Invested Principal" strokeDasharray="4 4" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center min-h-[200px]">
                    <TrendingUp className="text-zinc-300 mb-2" size={32} />
                    <h3 className="text-sm font-bold text-zinc-800">No Portfolio Data</h3>
                    <p className="text-xs text-zinc-455 mt-1">Add assets below to view performance curve reconstruction.</p>
                  </div>
                )}

                {/* Allocation Doughnut Chart & Metal Contribution metrics (Merged from Analytics) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Allocation Doughnut Chart */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <h3 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="text-amber-500" size={18} />
                      Asset Allocation By Value
                    </h3>
                    <div className="h-[200px] flex justify-center items-center">
                      {summary.goldVal === 0 && summary.silverVal === 0 ? (
                        <p className="text-xs text-zinc-400">No portfolio data available for allocation.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Gold', value: summary.goldVal, color: '#fbbf24' },
                                { name: 'Silver', value: summary.silverVal, color: '#a1a1aa' }
                              ].filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={summary.goldVal > 0 && summary.silverVal > 0 ? 5 : 0}
                              dataKey="value"
                              stroke="none"
                              strokeWidth={0}
                            >
                              {[
                                { name: 'Gold', value: summary.goldVal, color: '#fbbf24' },
                                { name: 'Silver', value: summary.silverVal, color: '#a1a1aa' }
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="flex justify-center gap-6 text-xs font-bold text-zinc-600 mt-4">
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-amber-400 inline-block"></span> Gold
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-zinc-400 inline-block"></span> Silver
                      </span>
                    </div>
                  </div>

                  {/* Metal Contribution metrics */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <h3 className="text-base font-bold text-zinc-900 mb-4">Holdings Allocation Metrics</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-50 rounded-2xl flex justify-between items-center">
                        <div>
                          <span className="text-xs font-extrabold text-amber-600 uppercase">Gold Holdings</span>
                          <p className="text-lg font-black text-zinc-900">{summary.goldWeight.toFixed(2)} g</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-zinc-500 block">Current Value</span>
                          <p className="text-sm font-black text-zinc-900">{currSymbol}{formatPrice(summary.goldVal)}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-50 rounded-2xl flex justify-between items-center">
                        <div>
                          <span className="text-xs font-extrabold text-zinc-500 uppercase">Silver Holdings</span>
                          <p className="text-lg font-black text-zinc-900">{summary.silverWeight.toFixed(2)} g</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-zinc-500 block">Current Value</span>
                          <p className="text-sm font-black text-zinc-900">{currSymbol}{formatPrice(summary.silverVal)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Gem className="text-amber-500" size={18} />
                    Personal Holdings & Jewelry Vault
                  </h3>
                  
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-zinc-950 hover:bg-zinc-900 text-white text-xs font-black px-4 py-2 rounded-full cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Plus size={14} />
                    Add Purchase
                  </button>
                </div>

                {/* Holdings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {holdings.map(h => (
                    <div key={h.id} className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            h.metal === 'gold' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          }`}>
                            {h.metal} {h.purity}
                          </span>
                          <h4 className="text-base font-black mt-2">{h.weight} Grams</h4>
                        </div>
                        <button
                          onClick={() => handleDeleteHolding(h.id)}
                          className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs border-t border-zinc-100 pt-3 text-zinc-600">
                        <div>
                          <span className="block text-[10px] text-zinc-400 uppercase">Purchase Price</span>
                          <span className="font-semibold text-zinc-900">{currSymbol}{formatPrice(h.purchasePrice)} / g</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-zinc-400 uppercase">Acquisition City</span>
                          <span className="font-semibold text-zinc-900">{h.purchaseCity}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-zinc-400 uppercase">Purchase Date</span>
                          <span className="font-semibold text-zinc-900">{new Date(h.purchaseDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {h.jewelryItems && h.jewelryItems.length > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3 text-xs space-y-1.5">
                          <span className="font-extrabold text-amber-800 flex items-center gap-1">
                            <Gem size={12} />
                            Jewelry Item Details
                          </span>
                          {h.jewelryItems.map((j: any) => (
                            <div key={j.id} className="flex justify-between text-amber-900 font-medium">
                              <span>{j.itemName} ({j.jewelryType})</span>
                              <span>{j.weight}g</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {holdings.length === 0 && (
                    <div className="md:col-span-2 text-center py-12 text-zinc-400 bg-white border border-zinc-200 rounded-3xl">
                      No holdings recorded yet. Click Add Purchase to build your vault.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: PROFILE */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                
                {/* Left Column: Settings & Identity */}
                <div className="space-y-6">
                  {/* Account Identity Card (Always Open, Above Preferences) */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                      Account Identity
                    </h3>
                    <div className="border border-zinc-150 rounded-2xl overflow-hidden bg-white">
                      <div className="p-4 space-y-4 bg-white">
                        <div className="flex items-center gap-3">
                          <img
                            src={session?.user?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150'}
                            alt="Profile Avatar"
                            className="w-12 h-12 rounded-full object-cover border border-zinc-200"
                          />
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black text-zinc-900">{session?.user?.name || 'Titas Deb'}</h4>
                            <p className="text-[10px] text-zinc-550 font-medium">{session?.user?.email || 'titas@aurumtrack.com'}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl py-2 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <LogOut size={11} />
                            Sign Out
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDangerZone(!showDangerZone)}
                            className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-250 rounded-xl py-2 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} />
                            Delete Account
                          </button>
                        </div>

                        {showDangerZone && (
                          <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                            <p className="text-[9px] text-rose-650 font-medium">
                              Deleting your account is permanent. All recorded holdings, jewelry details, active alert triggers, and watchlists will be permanently removed.
                            </p>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-zinc-455 uppercase block">
                                Type <span className="font-extrabold text-rose-700 select-all">delete my account</span> to confirm:
                              </label>
                              <input
                                type="text"
                                placeholder="delete my account"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full bg-white border border-rose-200/60 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none text-rose-800 placeholder:text-zinc-300"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={deleteConfirmText !== 'delete my account'}
                              onClick={handleDeleteAccount}
                              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-transparent text-white rounded-lg py-1.5 text-[10px] font-black transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                              Permanently Delete Account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preferences Card (Below Account Identity) */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                      Preferences
                    </h3>
                    {/* Global Settings (Currency, Location and Measurement) */}
                    <div className="space-y-3 bg-zinc-50 border border-zinc-150 rounded-2xl p-4 shadow-sm">
                      <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Global Settings</h4>
                      <div className="flex items-center gap-4">
                        {/* Custom Currency Selector */}
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Currency</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCurrencyOpen(!isCurrencyOpen);
                                setIsLocationOpen(false);
                                setIsMeasurementOpen(false);
                              }}
                              className="w-full justify-between bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                            >
                              {currency === 'INR' ? '₹ INR' : '$ USD'}
                              <ChevronDown size={12} className="text-zinc-500" />
                            </button>
                            {isCurrencyOpen && (
                              <>
                                <div className="fixed inset-0 z-35" onClick={() => setIsCurrencyOpen(false)} />
                                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40">
                                  {['INR', 'USD'].map(c => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => {
                                        setCurrency(c);
                                        setIsCurrencyOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                        currency === c ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                      }`}
                                    >
                                      {c === 'INR' ? '₹ INR' : '$ USD'}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Custom Location Selector */}
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Location</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsLocationOpen(!isLocationOpen);
                                setIsCurrencyOpen(false);
                                setIsMeasurementOpen(false);
                              }}
                              className="w-full justify-between bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                            >
                              {location}
                              <ChevronDown size={12} className="text-zinc-500" />
                            </button>
                            {isLocationOpen && (
                              <>
                                <div className="fixed inset-0 z-35" onClick={() => setIsLocationOpen(false)} />
                                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-40 overflow-y-auto">
                                  {CITIES.map(c => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => {
                                        setLocation(c);
                                        setIsLocationOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                        location === c ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                      }`}
                                    >
                                      {c}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Custom Measurement Selector */}
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Measurement</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsMeasurementOpen(!isMeasurementOpen);
                                setIsCurrencyOpen(false);
                                setIsLocationOpen(false);
                              }}
                              className="w-full justify-between bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                            >
                              {weight}
                              <ChevronDown size={12} className="text-zinc-500" />
                            </button>
                            {isMeasurementOpen && (
                              <>
                                <div className="fixed inset-0 z-35" onClick={() => setIsMeasurementOpen(false)} />
                                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-40 overflow-y-auto">
                                  {['1g', '10g', '100g', '1kg'].map(w => (
                                    <button
                                      key={w}
                                      type="button"
                                      onClick={() => {
                                        setWeight(w);
                                        setIsMeasurementOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                        weight === w ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                      }`}
                                    >
                                      {w}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Notifications & Security */}
                <div className="space-y-6">
                  {/* Notifications Card */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                      Notifications & Alerts
                    </h3>
                    
                    {/* Alert Drop */}
                    <div className="space-y-2 bg-zinc-50 border border-zinc-150 rounded-2xl p-4 shadow-sm">
                      <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Alert Drop</h5>
                      
                      {/* Create Alert */}
                      <form onSubmit={handleAddAlert} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAlertMetalOpen(!isAlertMetalOpen);
                                setIsAlertConditionOpen(false);
                              }}
                              className="w-full justify-between bg-white border border-zinc-250 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                            >
                              <span className="capitalize">{newAlertMetal}</span>
                              <ChevronDown size={12} className="text-zinc-500" />
                            </button>
                            {isAlertMetalOpen && (
                              <>
                                <div className="fixed inset-0 z-35" onClick={() => setIsAlertMetalOpen(false)} />
                                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40">
                                  {['gold', 'silver'].map(m => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        setNewAlertMetal(m);
                                        setIsAlertMetalOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors capitalize ${
                                        newAlertMetal === m ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                      }`}
                                    >
                                      {m}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAlertConditionOpen(!isAlertConditionOpen);
                                setIsAlertMetalOpen(false);
                              }}
                              className="w-full justify-between bg-white border border-zinc-255 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                            >
                              <span>{newAlertCondition === 'ABOVE' ? 'Price Above' : 'Price Below'}</span>
                              <ChevronDown size={12} className="text-zinc-500" />
                            </button>
                            {isAlertConditionOpen && (
                              <>
                                <div className="fixed inset-0 z-35" onClick={() => setIsAlertConditionOpen(false)} />
                                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40">
                                  {[
                                    { value: 'ABOVE', label: 'Price Above' },
                                    { value: 'BELOW', label: 'Price Below' }
                                  ].map(opt => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setNewAlertCondition(opt.value);
                                        setIsAlertConditionOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                        newAlertCondition === opt.value ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <input
                          type="number"
                          placeholder={`Target Price per gram (${currSymbol})`}
                          value={newAlertTarget}
                          onChange={(e) => setNewAlertTarget(e.target.value)}
                          className="w-full bg-white border border-zinc-255 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none"
                        />

                        <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl py-2 text-xs font-bold cursor-pointer transition-colors">
                          Add Alert Rule
                        </button>
                      </form>

                      {/* Active Alerts list */}
                      {alerts.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-zinc-150">
                          <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Active Alerts</h5>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {alerts.map(a => (
                              <div key={a.id} className="p-1.5 bg-white border border-zinc-150 rounded-lg flex justify-between items-center text-[9px] text-zinc-700">
                                <div>
                                  <span className="font-black capitalize text-zinc-900">{a.metal}</span>
                                  <span className="text-zinc-400 ml-1">if</span>
                                  <span className={`font-extrabold ml-1 ${a.condition === 'ABOVE' ? 'text-amber-600' : 'text-zinc-650'}`}>{a.condition}</span>
                                  <span className="font-black text-zinc-950 ml-1.5">
                                    {currSymbol}{formatPrice(a.targetPrice)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAlert(a.id)}
                                  className="text-zinc-400 hover:text-rose-500 font-bold px-1 py-0.5 cursor-pointer text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Weekly Lows */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                      <div className="space-y-0.5 max-w-[75%]">
                        <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Weekly Lows</h5>
                        <p className="text-[10px] text-zinc-500">Push notifications whenever Gold or Silver hits a weekly all-time low.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={weeklyNotify}
                          onChange={(e) => handleWeeklyNotifyToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Add Holding Modal Popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-5 animate-scaleUp">
            
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <PlusCircle className="text-amber-500" size={22} />
              Add Portfolio Holding
            </h3>

            <form onSubmit={handleAddHolding} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Metal</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMetalOpen(!isAddMetalOpen);
                        setIsAddPurityOpen(false);
                        setIsAddCityOpen(false);
                      }}
                      className="w-full justify-between bg-zinc-100 rounded-xl px-3 py-2 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer border border-zinc-200/20"
                    >
                      <span className="capitalize">{metalType}</span>
                      <ChevronDown size={12} className="text-zinc-500" />
                    </button>
                    {isAddMetalOpen && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsAddMetalOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-40 overflow-y-auto">
                          {['gold', 'silver'].map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setMetalType(m);
                                setIsAddMetalOpen(false);
                                if (m === 'silver') {
                                  setItemPurity('999');
                                } else {
                                  setItemPurity('24K');
                                }
                              }}
                              className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors capitalize ${
                                metalType === m ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1" style={{ opacity: metalType === 'gold' ? 1 : 0.4 }}>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Purity</label>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={metalType !== 'gold'}
                      onClick={() => {
                        setIsAddPurityOpen(!isAddPurityOpen);
                        setIsAddMetalOpen(false);
                        setIsAddCityOpen(false);
                      }}
                      className="w-full justify-between bg-zinc-100 rounded-xl px-3 py-2 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer border border-zinc-200/20 disabled:cursor-not-allowed"
                    >
                      {itemPurity}
                      <ChevronDown size={12} className="text-zinc-500" />
                    </button>
                    {isAddPurityOpen && metalType === 'gold' && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsAddPurityOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-40 overflow-y-auto">
                          {PURITIES.map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setItemPurity(p);
                                setIsAddPurityOpen(false);
                              }}
                              className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                itemPurity === p ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Weight (Grams)</label>
                  <input type="number" placeholder="10" required value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} className="w-full bg-zinc-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Price per Gram Paid ({currSymbol})</label>
                  <input type="number" placeholder="6000" required value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full bg-zinc-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                  {recommendedPrice !== null && (
                    <button
                      type="button"
                      onClick={() => setPurchasePrice(recommendedPrice.toFixed(2))}
                      className="text-[9px] font-black text-amber-600 hover:text-amber-700 mt-1 block transition-colors text-left"
                    >
                      💡 Use historical price: {currSymbol}{formatPrice(recommendedPrice)}/g
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Purchase Date</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full bg-zinc-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Acquisition City</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddCityOpen(!isAddCityOpen);
                        setIsAddMetalOpen(false);
                        setIsAddPurityOpen(false);
                      }}
                      className="w-full justify-between bg-zinc-100 rounded-xl px-3 py-2 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer border border-zinc-200/20"
                    >
                      {purchaseCity}
                      <ChevronDown size={12} className="text-zinc-500" />
                    </button>
                    {isAddCityOpen && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsAddCityOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-40 overflow-y-auto">
                          {CITIES.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setPurchaseCity(c);
                                setIsAddCityOpen(false);
                              }}
                              className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                purchaseCity === c ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Jewelry Checkbox & Sub-form */}
              <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
                <input type="checkbox" checked={isJewelry} onChange={(e) => setIsJewelry(e.target.checked)} className="rounded cursor-pointer" />
                <span className="text-xs font-bold text-zinc-700">Is this holding inherited/personal jewelry?</span>
              </div>

              {isJewelry && (
                <div className="grid grid-cols-2 gap-3 bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-800 uppercase">Jewelry Type</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddJewelryTypeOpen(!isAddJewelryTypeOpen);
                        }}
                        className="w-full justify-between bg-white rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer border border-zinc-200/20"
                      >
                        {jewelryType}
                        <ChevronDown size={12} className="text-zinc-500" />
                      </button>
                      {isAddJewelryTypeOpen && (
                        <>
                          <div className="fixed inset-0 z-35" onClick={() => setIsAddJewelryTypeOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-40 overflow-y-auto">
                            {['Necklace', 'Chain', 'Ring', 'Bracelet', 'Bangle', 'Pendant', 'Earrings'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setJewelryType(t);
                                  setIsAddJewelryTypeOpen(false);
                                }}
                                className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                  jewelryType === t ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-800 uppercase">Item Identifier</label>
                    <input type="text" placeholder="My Chain" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none" />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Holding Notes</label>
                <input type="text" placeholder="Details or origin" value={holdingNotes} onChange={(e) => setHoldingNotes(e.target.value)} className="w-full bg-zinc-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full px-5 py-2 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-full px-5 py-2 text-xs font-black cursor-pointer">Save Purchase</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* User Profile Settings Modal Popup */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-[32px] p-6 shadow-2xl relative space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            {/* Close Header */}
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <h3 className="text-lg font-black text-zinc-900">
                User Profile Settings
              </h3>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 font-extrabold text-xs bg-zinc-100 rounded-full px-3.5 py-1 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

            {/* Global Settings (Currency, Location and Measurement) */}
            <div className="space-y-3 bg-zinc-50 border border-zinc-150 rounded-2xl p-4 shadow-sm">
              <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Global Settings</h4>
              <div className="flex items-center gap-4">
                {/* Custom Currency Selector */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Currency</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCurrencyOpen(!isCurrencyOpen);
                        setIsLocationOpen(false);
                        setIsMeasurementOpen(false);
                      }}
                      className="w-full justify-between bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                    >
                      {currency === 'INR' ? '₹ INR' : '$ USD'}
                      <ChevronDown size={12} className="text-zinc-500" />
                    </button>
                    {isCurrencyOpen && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsCurrencyOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40">
                          {['INR', 'USD'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setCurrency(c);
                                setIsCurrencyOpen(false);
                              }}
                              className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                currency === c ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {c === 'INR' ? '₹ INR' : '$ USD'}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Custom Location Selector */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Location</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLocationOpen(!isLocationOpen);
                        setIsCurrencyOpen(false);
                        setIsMeasurementOpen(false);
                      }}
                      className="w-full justify-between bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                    >
                      {location}
                      <ChevronDown size={12} className="text-zinc-500" />
                    </button>
                    {isLocationOpen && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsLocationOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-40 overflow-y-auto">
                          {CITIES.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setLocation(c);
                                setIsLocationOpen(false);
                              }}
                              className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                location === c ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Custom Measurement Selector */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Measurement</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMeasurementOpen(!isMeasurementOpen);
                        setIsCurrencyOpen(false);
                        setIsLocationOpen(false);
                      }}
                      className="w-full justify-between bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                    >
                      {weight}
                      <ChevronDown size={12} className="text-zinc-500" />
                    </button>
                    {isMeasurementOpen && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsMeasurementOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40 max-h-40 overflow-y-auto">
                          {['1g', '10g', '100g', '1kg'].map(w => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => {
                                setWeight(w);
                                setIsMeasurementOpen(false);
                              }}
                              className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                weight === w ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: USER DETAIL */}
            <div className="border border-zinc-150 rounded-2xl overflow-hidden bg-zinc-50/50">
              <button
                type="button"
                onClick={() => setIsUserDetailOpen(!isUserDetailOpen)}
                className="w-full flex justify-between items-center px-4 py-3 bg-zinc-50 border-b border-zinc-150 text-xs font-black text-zinc-800 uppercase tracking-wider outline-none cursor-pointer"
              >
                <span>User Detail</span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isUserDetailOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isUserDetailOpen && (
                <div className="p-4 space-y-4 animate-fadeIn bg-white">
                  <div className="flex items-center gap-3">
                    <img
                      src={session?.user?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150'}
                      alt="Profile Avatar"
                      className="w-12 h-12 rounded-full object-cover border border-zinc-200"
                    />
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-black text-zinc-900">{session?.user?.name || 'Titas Deb'}</h4>
                      <p className="text-[10px] text-zinc-500 font-medium">{session?.user?.email || 'titas@aurumtrack.com'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl py-2 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <LogOut size={11} />
                      Sign Out
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDangerZone(!showDangerZone)}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-250 rounded-xl py-2 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={11} />
                      Delete Account
                    </button>
                  </div>

                  {showDangerZone && (
                    <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                      <p className="text-[9px] text-rose-650 font-medium">
                        Deleting your account is permanent. All recorded holdings, jewelry details, active alert triggers, and watchlists will be permanently removed.
                      </p>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-450 uppercase block">
                          Type <span className="font-extrabold text-rose-700 select-all">delete my account</span> to confirm:
                        </label>
                        <input
                          type="text"
                          placeholder="delete my account"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="w-full bg-white border border-rose-200/60 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none text-rose-800 placeholder:text-zinc-300"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={deleteConfirmText !== 'delete my account'}
                        onClick={handleDeleteAccount}
                        className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-transparent text-white rounded-lg py-1.5 text-[10px] font-black transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        Permanently Delete Account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-150 my-2"></div>

            {/* SECTION 2: NOTIFICATIONS */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Notifications</h4>
              
              {/* Alert Drop */}
              <div className="space-y-2 bg-zinc-50 border border-zinc-150 rounded-2xl p-4 shadow-sm">
                <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Alert Drop</h5>
                
                {/* Create Alert */}
                <form onSubmit={handleAddAlert} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAlertMetalOpen(!isAlertMetalOpen);
                          setIsAlertConditionOpen(false);
                        }}
                        className="w-full justify-between bg-white border border-zinc-250 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                      >
                        <span className="capitalize">{newAlertMetal}</span>
                        <ChevronDown size={12} className="text-zinc-500" />
                      </button>
                      {isAlertMetalOpen && (
                        <>
                          <div className="fixed inset-0 z-35" onClick={() => setIsAlertMetalOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40">
                            {['gold', 'silver'].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  setNewAlertMetal(m);
                                  setIsAlertMetalOpen(false);
                                }}
                                className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors capitalize ${
                                  newAlertMetal === m ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAlertConditionOpen(!isAlertConditionOpen);
                          setIsAlertMetalOpen(false);
                        }}
                        className="w-full justify-between bg-white border border-zinc-250 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-800 flex items-center gap-1.5 outline-none cursor-pointer"
                      >
                        <span>{newAlertCondition === 'ABOVE' ? 'Price Above' : 'Price Below'}</span>
                        <ChevronDown size={12} className="text-zinc-500" />
                      </button>
                      {isAlertConditionOpen && (
                        <>
                          <div className="fixed inset-0 z-35" onClick={() => setIsAlertConditionOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-lg py-1.5 z-40">
                            {[
                              { value: 'ABOVE', label: 'Price Above' },
                              { value: 'BELOW', label: 'Price Below' }
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setNewAlertCondition(opt.value);
                                  setIsAlertConditionOpen(false);
                                }}
                                className={`w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors ${
                                  newAlertCondition === opt.value ? 'text-amber-600 bg-amber-50/20' : 'text-zinc-700'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <input
                    type="number"
                    placeholder={`Target Price per gram (${currSymbol})`}
                    value={newAlertTarget}
                    onChange={(e) => setNewAlertTarget(e.target.value)}
                    className="w-full bg-white border border-zinc-250 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none"
                  />

                  <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl py-2 text-xs font-bold cursor-pointer transition-colors">
                    Add Alert Rule
                  </button>
                </form>

                {/* Active Alerts list just below form with cross */}
                {alerts.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-150">
                    <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Active Alerts</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {alerts.map(a => (
                        <div key={a.id} className="p-1.5 bg-white border border-zinc-150 rounded-lg flex justify-between items-center text-[9px] text-zinc-700">
                          <div>
                            <span className="font-black capitalize text-zinc-900">{a.metal}</span>
                            <span className="text-zinc-400 ml-1">if</span>
                            <span className={`font-extrabold ml-1 ${a.condition === 'ABOVE' ? 'text-amber-600' : 'text-zinc-650'}`}>{a.condition}</span>
                            <span className="font-black text-zinc-950 ml-1.5">
                              {currSymbol}{formatPrice(a.targetPrice)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAlert(a.id)}
                            className="text-zinc-400 hover:text-rose-500 font-bold px-1 py-0.5 cursor-pointer text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Lows */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div className="space-y-0.5 max-w-[75%]">
                  <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Weekly Lows</h5>
                  <p className="text-[10px] text-zinc-500">Push notifications whenever Gold or Silver hits a weekly all-time low.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyNotify}
                    onChange={(e) => handleWeeklyNotifyToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            <div className="border-t border-zinc-150 my-2"></div>

            {/* SECTION 3: SIGN OUT */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="w-full bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm uppercase tracking-wider"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>

          </div>
        </div>
      )}


      {/* Custom Confirmation Prompt */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-[28px] max-w-sm w-full p-6 shadow-xl space-y-6 animate-scaleUp">
            <div className="space-y-2">
              <h4 className="text-lg font-black text-zinc-950 tracking-tight leading-none">{confirmModal.title}</h4>
              <p className="text-xs text-zinc-500 font-semibold leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 rounded-full text-[10px] font-black text-zinc-750 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 rounded-full text-[10px] font-black text-white bg-zinc-950 hover:bg-zinc-900 shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-8 text-center text-xs text-zinc-400 space-y-2">
        <p>© 2026 aurumtrack portfolio intelligence platform. All rights reserved.</p>
        <p>Market feeds delayed by 15m. Built with Next.js, React, Tailwind CSS, Recharts, and Prisma.</p>
      </footer>
    </div>
  );
}
