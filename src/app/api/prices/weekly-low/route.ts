import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Kolkata';
    const currency = searchParams.get('currency') || 'INR';

    // 7 days ago date
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    // Query Gold (24K) weekly low
    const goldLowSql = `
      SELECT MIN(price) as min_price FROM price_history
      WHERE metal = $1 AND purity = $2 AND city = $3 AND currency = $4
      AND timestamp >= $5
    `;
    const goldLowRows = await query<{ min_price: number | null }>(goldLowSql, ['gold', '24K', city, currency, dateStr]);
    const goldWeeklyMin = goldLowRows[0]?.min_price;

    // Query Silver weekly low
    const silverLowSql = `
      SELECT MIN(price) as min_price FROM price_history
      WHERE metal = $1 AND city = $2 AND currency = $3
      AND timestamp >= $4
    `;
    const silverLowRows = await query<{ min_price: number | null }>(silverLowSql, ['silver', city, currency, dateStr]);
    const silverWeeklyMin = silverLowRows[0]?.min_price;

    // Get current gold price
    const goldCurSql = `
      SELECT price FROM price_history
      WHERE metal = $1 AND purity = $2 AND city = $3 AND currency = $4
      ORDER BY timestamp DESC LIMIT 1
    `;
    const goldCurRows = await query<{ price: number }>(goldCurSql, ['gold', '24K', city, currency]);
    const goldCurrent = goldCurRows[0]?.price;

    // Get current silver price
    const silverCurSql = `
      SELECT price FROM price_history
      WHERE metal = $1 AND city = $2 AND currency = $3
      ORDER BY timestamp DESC LIMIT 1
    `;
    const silverCurRows = await query<{ price: number }>(silverCurSql, ['silver', city, currency]);
    const silverCurrent = silverCurRows[0]?.price;

    const isGoldWeeklyLow = goldCurrent && goldWeeklyMin ? goldCurrent <= goldWeeklyMin : false;
    const isSilverWeeklyLow = silverCurrent && silverWeeklyMin ? silverCurrent <= silverWeeklyMin : false;

    return NextResponse.json({
      city,
      currency,
      gold: {
        current: goldCurrent,
        weeklyMin: goldWeeklyMin,
        isWeeklyLow: isGoldWeeklyLow
      },
      silver: {
        current: silverCurrent,
        weeklyMin: silverWeeklyMin,
        isWeeklyLow: isSilverWeeklyLow
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to calculate weekly lows', details: err.message }, { status: 500 });
  }
}
