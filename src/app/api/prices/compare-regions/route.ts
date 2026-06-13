import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metal = searchParams.get('metal') || 'gold';
    const purity = searchParams.get('purity') || '24K';
    const currency = searchParams.get('currency') || 'INR';

    // Query the latest price for each city
    let sql = '';
    let params: any[] = [];

    // Subquery or window function to get the latest record per city
    // In SQLite, we can group by city and order by timestamp
    if (metal === 'gold') {
      sql = `
        SELECT city, price, timestamp FROM (
          SELECT city, price, timestamp,
          ROW_NUMBER() OVER (PARTITION BY city ORDER BY timestamp DESC) as rn
          FROM price_history
          WHERE metal = $1 AND purity = $2 AND currency = $3
        ) t WHERE t.rn = 1
      `;
      params = [metal, purity, currency];
    } else {
      sql = `
        SELECT city, price, timestamp FROM (
          SELECT city, price, timestamp,
          ROW_NUMBER() OVER (PARTITION BY city ORDER BY timestamp DESC) as rn
          FROM price_history
          WHERE metal = $1 AND purity IS NULL AND currency = $2
        ) t WHERE t.rn = 1
      `;
      params = [metal, currency];
    }

    const rows = await query<{ city: string; price: number; timestamp: string }>(sql, params);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No price records found for comparison' }, { status: 404 });
    }

    // Calculate Highest, Lowest, and Average
    let highest = rows[0];
    let lowest = rows[0];
    let sum = 0;

    const list = rows.map(row => {
      const priceVal = Number(row.price);
      sum += priceVal;

      if (priceVal > Number(highest.price)) {
        highest = row;
      }
      if (priceVal < Number(lowest.price)) {
        lowest = row;
      }

      return {
        city: row.city,
        price: priceVal,
        timestamp: row.timestamp
      };
    });

    const average = sum / rows.length;

    return NextResponse.json({
      metal,
      purity: metal === 'gold' ? purity : null,
      currency,
      highest: {
        city: highest.city,
        price: Number(highest.price)
      },
      lowest: {
        city: lowest.city,
        price: Number(lowest.price)
      },
      average: Number(average.toFixed(4)),
      comparison: list
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve regional comparison', details: err.message }, { status: 500 });
  }
}
