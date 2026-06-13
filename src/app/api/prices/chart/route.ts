import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metal = searchParams.get('metal') || 'gold';
    const purity = searchParams.get('purity') || '24K';
    const city = searchParams.get('city') || 'Kolkata';
    const currency = searchParams.get('currency') || 'INR';
    const timeframe = searchParams.get('timeframe') || '7D'; // 1D, 7D, 1M, 3M, 6M, 1Y, 5Y, MAX

    // Calculate start date based on timeframe
    const endDate = new Date('2026-06-13T12:00:00Z'); // Current simulated end date
    let startDate = new Date(endDate.getTime());
    let downsampleRatio = 1; // 1 means no downsampling

    switch (timeframe) {
      case '1D':
        // For 1D, we will generate intraday ticks (simulated hourly ticks from the past 24h)
        // using the latest daily price.
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7D':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        downsampleRatio = 2; // Return every 2nd day
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        downsampleRatio = 4; // Return every 4th day (~weekly)
        break;
      case '5Y':
        startDate.setFullYear(endDate.getFullYear() - 5);
        downsampleRatio = 20; // Return every 20th day (~monthly)
        break;
      case 'MAX':
        startDate.setFullYear(endDate.getFullYear() - 10); // Check all history
        downsampleRatio = 30; // Return monthly
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const startIsoStr = startDate.toISOString().split('T')[0] + 'T00:00:00Z';

    let sql = '';
    let params: any[] = [];

    if (metal === 'gold') {
      sql = `
        SELECT price, timestamp FROM price_history
        WHERE metal = $1 AND purity = $2 AND city = $3 AND currency = $4 AND timestamp >= CAST($5 AS TIMESTAMPTZ)
        ORDER BY timestamp ASC
      `;
      params = [metal, purity, city, currency, startIsoStr];
    } else {
      sql = `
        SELECT price, timestamp FROM price_history
        WHERE metal = $1 AND city = $2 AND currency = $3 AND timestamp >= CAST($4 AS TIMESTAMPTZ)
        ORDER BY timestamp ASC
      `;
      params = [metal, city, currency, startIsoStr];
    }

    let rows = await query<{ price: number; timestamp: string }>(sql, params);

    // If 1D intraday request
    if (timeframe === '1D') {
      // Intraday generation for high-fidelity interactive feel
      const basePrice = rows[rows.length - 1]?.price || (metal === 'gold' ? 6300 : metal === 'silver' ? 80 : 0.75);
      const ticks: any[] = [];
      for (let h = 0; h <= 24; h++) {
        const tickTime = new Date(startDate.getTime() + h * 60 * 60 * 1000);
        // Add subtle metal-specific intraday walk to make the charts independent
        let hourNoise = 0;
        if (metal === 'gold') {
          hourNoise = Math.sin(h * 0.4) * 0.0035 + Math.cos(h * 0.7) * 0.0015 - Math.sin(h * 0.15) * 0.001;
        } else {
          hourNoise = Math.sin(h * 0.65) * 0.005 - Math.cos(h * 0.45) * 0.0025 + Math.cos(h * 0.25) * 0.0015;
        }
        const tickPrice = basePrice * (1 + hourNoise);
        ticks.push({
          price: Number(tickPrice.toFixed(4)),
          timestamp: tickTime.toISOString(),
          label: tickTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      return NextResponse.json({ timeframe, data: ticks });
    }

    // Downsample dataset to optimize payload size for charts
    let finalData = rows;
    if (downsampleRatio > 1) {
      finalData = rows.filter((_, idx) => idx % downsampleRatio === 0);
    }

    // Format timestamps for chart labels
    const formattedData = finalData.map(row => {
      const d = new Date(row.timestamp);
      return {
        price: Number(Number(row.price).toFixed(4)),
        timestamp: row.timestamp,
        label: d.toLocaleDateString([], { day: '2-digit', month: 'short', year: timeframe === '5Y' || timeframe === 'MAX' ? '2-digit' : undefined })
      };
    });

    return NextResponse.json({
      timeframe,
      data: formattedData
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve chart data', details: err.message }, { status: 500 });
  }
}
