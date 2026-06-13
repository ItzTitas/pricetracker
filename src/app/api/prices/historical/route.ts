import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metal = searchParams.get('metal'); // 'gold', 'silver', 'copper'
    const purity = searchParams.get('purity'); // '24K', '22K', '20K', '18K' (null for silver/copper)
    const city = searchParams.get('city') || 'Kolkata';
    const currency = searchParams.get('currency') || 'INR';
    const dateStr = searchParams.get('date'); // 'YYYY-MM-DD'

    if (!metal || !dateStr) {
      return NextResponse.json({ error: 'Missing metal or date parameter' }, { status: 400 });
    }

    // Format target date
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    const formattedDate = targetDate.toISOString().split('T')[0];

    // Query historical price
    // Note: purity can be null for silver/copper
    let histSql = '';
    let histParams: any[] = [];

    if (metal === 'gold') {
      histSql = `
        SELECT price, timestamp FROM price_history 
        WHERE metal = $1 AND purity = $2 AND city = $3 AND currency = $4 
        AND (date(timestamp) = CAST($5 AS DATE) OR timestamp::text LIKE $6)
        ORDER BY timestamp DESC LIMIT 1
      `;
      histParams = [metal, purity || '24K', city, currency, formattedDate, `${formattedDate}%`];
    } else {
      histSql = `
        SELECT price, timestamp FROM price_history 
        WHERE metal = $1 AND city = $2 AND currency = $3 
        AND (date(timestamp) = CAST($4 AS DATE) OR timestamp::text LIKE $5)
        ORDER BY timestamp DESC LIMIT 1
      `;
      histParams = [metal, city, currency, formattedDate, `${formattedDate}%`];
    }

    const histRows = await query<{ price: number; timestamp: string }>(histSql, histParams);

    if (histRows.length === 0) {
      return NextResponse.json({ error: `No historical price found for ${metal} on ${dateStr}` }, { status: 404 });
    }

    const historicalPrice = histRows[0].price;

    // Fetch the latest/current price from the database (today's price)
    let curSql = '';
    let curParams: any[] = [];
    if (metal === 'gold') {
      curSql = `
        SELECT price FROM price_history 
        WHERE metal = $1 AND purity = $2 AND city = $3 AND currency = $4 
        ORDER BY timestamp DESC LIMIT 1
      `;
      curParams = [metal, purity || '24K', city, currency];
    } else {
      curSql = `
        SELECT price FROM price_history 
        WHERE metal = $1 AND city = $2 AND currency = $3 
        ORDER BY timestamp DESC LIMIT 1
      `;
      curParams = [metal, city, currency];
    }

    const curRows = await query<{ price: number }>(curSql, curParams);
    const currentPrice = curRows[0]?.price || historicalPrice * 1.05; // Fallback if no current price exists

    const absoluteDifference = currentPrice - historicalPrice;
    const percentageChange = (absoluteDifference / historicalPrice) * 100;

    return NextResponse.json({
      metal,
      purity: metal === 'gold' ? purity : null,
      city,
      currency,
      date: dateStr,
      historicalPrice,
      currentPrice,
      absoluteDifference,
      percentageChange
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve historical price', details: err.message }, { status: 500 });
  }
}
