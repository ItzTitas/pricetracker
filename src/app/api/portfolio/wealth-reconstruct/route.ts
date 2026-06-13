import { NextResponse } from 'next/server';
import { prisma, querySql } from '@/lib/db';
import { getServerSession } from 'next-auth';

const pgUrl = process.env.DATABASE_URL;
const isPostgres = !!pgUrl;

const demoUserId = 'demo-user-id';

export async function GET() {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || demoUserId;

    // Fetch user holdings
    let holdings: any[] = [];
    if (isPostgres) {
      holdings = await prisma.holding.findMany({
        where: { userId, isArchived: false }
      });
    } else {
      holdings = await querySql<any>('SELECT * FROM holdings WHERE user_id = $1 AND is_archived = 0', [userId]);
      holdings = holdings.map(h => ({
        id: h.id,
        metal: h.metal,
        purity: h.purity,
        weight: h.weight,
        purchaseDate: new Date(h.purchase_date),
        purchasePrice: h.purchase_price,
        purchaseCity: h.purchase_city
      }));
    }

    if (holdings.length === 0) {
      return NextResponse.json({ timeline: [] });
    }

    // Sort holdings by oldest first
    holdings.sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());

    const oldestDate = new Date(holdings[0].purchaseDate);
    const today = new Date('2026-06-13T12:00:00Z'); // simulated current date

    // We will generate a wealth timeline.
    // To keep it highly performant, we downsample the timeline:
    // - Daily for the last 30 days
    // - Weekly for the past 6 months
    // - Monthly for dates older than 6 months
    const timelineDates: Date[] = [];
    let currentCursor = new Date(oldestDate);

    while (currentCursor <= today) {
      timelineDates.push(new Date(currentCursor));
      
      const timeDiff = today.getTime() - currentCursor.getTime();
      const diffDays = timeDiff / (1000 * 3600 * 24);

      if (diffDays < 30) {
        currentCursor.setDate(currentCursor.getDate() + 1); // daily
      } else if (diffDays < 180) {
        currentCursor.setDate(currentCursor.getDate() + 7); // weekly
      } else {
        currentCursor.setMonth(currentCursor.getMonth() + 1); // monthly
      }
    }

    // Fetch all historical price history at once to avoid N+1 queries
    // We get all prices from oldestDate to today
    let prices: any[] = [];
    const oldestIso = oldestDate.toISOString().split('T')[0] + 'T00:00:00Z';
    
    if (isPostgres) {
      prices = await prisma.priceHistory.findMany({
        where: {
          timestamp: { gte: new Date(oldestIso) }
        },
        orderBy: { timestamp: 'asc' }
      });
    } else {
      prices = await querySql<any>('SELECT * FROM price_history WHERE timestamp >= $1 ORDER BY timestamp ASC', [oldestIso]);
      prices = prices.map(p => ({
        metal: p.metal,
        purity: p.purity,
        city: p.city,
        currency: p.currency,
        price: p.price,
        timestamp: new Date(p.timestamp)
      }));
    }

    // Group prices by date, metal, purity, city, currency for O(1) lookups
    const priceCache: Record<string, number> = {};
    prices.forEach(p => {
      const dateKey = p.timestamp.toISOString().split('T')[0];
      const key = `${dateKey}_${p.metal}_${p.purity || 'null'}_${p.city}_${p.currency}`;
      priceCache[key] = p.price;
    });

    const timeline: any[] = [];

    // For each date, calculate total invested principal and current spot valuation
    timelineDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      let totalInvested = 0;
      let totalValue = 0;

      // Filter holdings that were purchased on or before this date
      const activeHoldings = holdings.filter(h => h.purchaseDate <= date);

      activeHoldings.forEach(h => {
        // Principal = weight * purchasePrice
        const principal = h.weight * h.purchasePrice;
        totalInvested += principal;

        // Current spot valuation on this date
        // Try to look up the price on this date in the cache, or fallback to the purchasePrice
        // For currencies, we assume the holding currency matches the currency recorded
        const currency = 'INR'; // default currency for this calculation
        const key = `${dateStr}_${h.metal}_${h.purity}_${h.purchaseCity}_${currency}`;
        const pricePerGram = priceCache[key] || h.purchasePrice;

        totalValue += h.weight * pricePerGram;
      });

      const profit = totalValue - totalInvested;
      const returnPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

      timeline.push({
        date: dateStr,
        label: date.toLocaleDateString([], { month: 'short', year: '2-digit' }),
        invested: Number(totalInvested.toFixed(2)),
        value: Number(totalValue.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        returnPct: Number(returnPct.toFixed(2))
      });
    });

    return NextResponse.json({ timeline });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to reconstruct wealth history', details: err.message }, { status: 500 });
  }
}
