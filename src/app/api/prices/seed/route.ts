import { NextResponse } from 'next/server';
import { initDatabase, execute, query } from '@/lib/db';
import path from 'path';

const CITIES = ['Kolkata', 'Mumbai', 'Delhi', 'Chennai', 'NewYork', 'London', 'Dubai'];
const PURITIES = ['24K', '22K', '20K', '18K'];

// Base Prices per gram in USD
const BASE_PRICES_USD: Record<string, number> = {
  gold: 75.50,
  silver: 0.95
};

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

export async function POST() {
  try {
    await initDatabase();

    const pgUrl = process.env.DATABASE_URL;
    const isPostgres = !!pgUrl;

    console.log('Clearing old data...');
    if (isPostgres) {
      await execute('DELETE FROM price_history');
    } else {
      const DB_FILE = path.join(process.cwd(), 'aurumtrack.db');
      const sqlite3 = require('sqlite3');
      const db = new sqlite3.Database(DB_FILE);
      await new Promise<void>((resolve, reject) => {
        db.run('DELETE FROM price_history', (err: any) => {
          db.close();
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('Seeding 30 years of historical database records...');
    const endDate = new Date('2026-06-13T12:00:00Z');
    const daysToSeed = 30 * 365;

    // Helper to generate price trends
    const getTrendPrice = (base: number, dayIndex: number, totalDays: number) => {
      // dayIndex goes from 1 (30 years ago) to totalDays (today)
      const progression = dayIndex / totalDays; // 0 to 1
      const trendMultiplier = 0.15 + progression * 0.85; 
      const noise = Math.sin(dayIndex * 0.05) * 0.04 + Math.cos(dayIndex * 0.13) * 0.02;
      return base * trendMultiplier * (1 + noise);
    };

    let records: Array<[string, string | null, string, string, number, string]> = [];
    const batchSize = 1000;

    if (isPostgres) {
      for (let d = 0; d < daysToSeed; d++) {
        const currentDate = new Date(endDate.getTime() - d * 24 * 60 * 60 * 1000);
        const isoStr = currentDate.toISOString().split('T')[0] + 'T00:00:00Z';

        CITIES.forEach(city => {
          const locMult = LOCATION_MULTIPLIERS[city];

          // Gold
          const goldBase = getTrendPrice(BASE_PRICES_USD.gold, daysToSeed - d, daysToSeed);
          PURITIES.forEach(purity => {
            const purityMult = PURITY_MULTIPLIERS[purity];
            const priceUSD = goldBase * locMult * purityMult;
            records.push(['gold', purity, city, 'USD', priceUSD, isoStr]);
            records.push(['gold', purity, city, 'INR', priceUSD * 83.5, isoStr]);
          });

          // Silver
          const silverBase = getTrendPrice(BASE_PRICES_USD.silver, daysToSeed - d, daysToSeed);
          const silverUSD = silverBase * locMult;
          records.push(['silver', null, city, 'USD', silverUSD, isoStr]);
          records.push(['silver', null, city, 'INR', silverUSD * 83.5, isoStr]);
        });

        if (records.length >= batchSize) {
          await insertBatch(records);
          records = [];
        }
      }
      if (records.length > 0) {
        await insertBatch(records);
      }
    } else {
      // SQLite High Performance Seeding via single Transaction
      const DB_FILE = path.join(process.cwd(), 'aurumtrack.db');
      const sqlite3 = require('sqlite3');
      const db = new sqlite3.Database(DB_FILE);

      await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          const stmt = db.prepare('INSERT INTO price_history (id, metal, purity, city, currency, price, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)');

          for (let d = 0; d < daysToSeed; d++) {
            const currentDate = new Date(endDate.getTime() - d * 24 * 60 * 60 * 1000);
            const isoStr = currentDate.toISOString().split('T')[0] + 'T00:00:00Z';

            CITIES.forEach(city => {
              const locMult = LOCATION_MULTIPLIERS[city];

              // Gold
              const goldBase = getTrendPrice(BASE_PRICES_USD.gold, daysToSeed - d, daysToSeed);
              PURITIES.forEach(purity => {
                const purityMult = PURITY_MULTIPLIERS[purity];
                const priceUSD = goldBase * locMult * purityMult;
                const priceINR = priceUSD * 83.5;

                stmt.run(Math.random().toString(36).substring(2, 15), 'gold', purity, city, 'USD', priceUSD, isoStr);
                stmt.run(Math.random().toString(36).substring(2, 15), 'gold', purity, city, 'INR', priceINR, isoStr);
              });

              // Silver
              const silverBase = getTrendPrice(BASE_PRICES_USD.silver, daysToSeed - d, daysToSeed);
              const silverUSD = silverBase * locMult;
              const silverINR = silverUSD * 83.5;

              stmt.run(Math.random().toString(36).substring(2, 15), 'silver', null, city, 'USD', silverUSD, isoStr);
              stmt.run(Math.random().toString(36).substring(2, 15), 'silver', null, city, 'INR', silverINR, isoStr);
            });
          }

          stmt.finalize();
          db.run('COMMIT', (err: any) => {
            db.close();
            if (err) reject(err);
            else resolve();
          });
        });
      });
    }

    const countRes = await query<{ count: number }>('SELECT COUNT(*) as count FROM price_history');
    return NextResponse.json({ message: 'Seeding completed successfully', count: (countRes[0] as any).count });
  } catch (err: any) {
    console.error('Seeding error:', err);
    return NextResponse.json({ error: 'Failed to seed database', details: err.message }, { status: 500 });
  }
}

async function insertBatch(records: Array<[string, string | null, string, string, number, string]>) {
  const subBatchSize = 100;
  for (let i = 0; i < records.length; i += subBatchSize) {
    const chunk = records.slice(i, i + subBatchSize);
    const placeholders = chunk.map((_, idx) => `($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7})`).join(', ');
    
    const sql = `
      INSERT INTO price_history (id, metal, purity, city, currency, price, timestamp)
      VALUES ${placeholders}
    `;
    
    const params = chunk.map(r => [
      Math.random().toString(36).substring(2, 15),
      r[0],
      r[1],
      r[2],
      r[3],
      r[4],
      r[5]
    ]).flat();
    
    await execute(sql, params);
  }
}
