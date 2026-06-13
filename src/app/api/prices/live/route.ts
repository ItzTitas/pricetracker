import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const TROY_OUNCE_TO_GRAM = 31.1034768;
const POUND_TO_GRAM = 453.592;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchYahooData(ticker: string, period = '40d', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${period}&interval=${interval}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];
    
    const closes = result.indicators?.quote?.[0]?.close || [];
    return closes.filter((c: any) => c !== null && c !== undefined) as number[];
  } catch (err) {
    console.error(`Error fetching Yahoo data for ${ticker}:`, err);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch live data from Yahoo Finance
    const [goldRaw, silverRaw, copperRaw, usdInrRaw] = await Promise.all([
      fetchYahooData('GC=F', '40d', '1d'),
      fetchYahooData('SI=F', '40d', '1d'),
      fetchYahooData('HG=F', '40d', '1d'),
      fetchYahooData('INR=X', '40d', '1d')
    ]);

    const exchangeRate = usdInrRaw.length > 0 ? usdInrRaw[usdInrRaw.length - 1] : 83.5;

    const convert = (arr: number[], divisor: number) => {
      return arr.map(p => p / divisor);
    };

    const goldHistory = convert(goldRaw, TROY_OUNCE_TO_GRAM);
    const silverHistory = convert(silverRaw, TROY_OUNCE_TO_GRAM);
    const copperHistory = convert(copperRaw, POUND_TO_GRAM);

    // If Yahoo Finance fails or returns empty, try to get fallback from database
    let goldCurrent = goldHistory[goldHistory.length - 1] || 0;
    let silverCurrent = silverHistory[silverHistory.length - 1] || 0;
    let copperCurrent = copperHistory[copperHistory.length - 1] || 0;

    let isMock = false;

    if (goldCurrent === 0) {
      isMock = true;
      // Fetch latest from database as backup
      const latestGold = await query<{ price: number }>('SELECT price FROM price_history WHERE metal = $1 AND currency = $2 ORDER BY timestamp DESC LIMIT 1', ['gold', 'USD']);
      goldCurrent = latestGold[0]?.price || 75.50;

      const latestSilver = await query<{ price: number }>('SELECT price FROM price_history WHERE metal = $1 AND currency = $2 ORDER BY timestamp DESC LIMIT 1', ['silver', 'USD']);
      silverCurrent = latestSilver[0]?.price || 0.95;

      const latestCopper = await query<{ price: number }>('SELECT price FROM price_history WHERE metal = $1 AND currency = $2 ORDER BY timestamp DESC LIMIT 1', ['copper', 'USD']);
      copperCurrent = latestCopper[0]?.price || 0.009;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      exchange_rate: exchangeRate,
      is_mock: isMock,
      prices: {
        gold: {
          current: goldCurrent,
          history: goldHistory.length > 0 ? goldHistory : [goldCurrent * 0.98, goldCurrent * 0.99, goldCurrent]
        },
        silver: {
          current: silverCurrent,
          history: silverHistory.length > 0 ? silverHistory : [silverCurrent * 0.98, silverCurrent * 0.99, silverCurrent]
        },
        copper: {
          current: copperCurrent,
          history: copperHistory.length > 0 ? copperHistory : [copperCurrent * 0.98, copperCurrent * 0.99, copperCurrent]
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch live prices', details: err.message }, { status: 500 });
  }
}
