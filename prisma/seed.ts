import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  console.log('Clearing old price history...');
  await prisma.priceHistory.deleteMany({});

  console.log('Seeding 30 years of historical database records...');
  const endDate = new Date('2026-06-13T12:00:00Z');
  const daysToSeed = 30 * 365;

  const getTrendPrice = (base: number, dayIndex: number, totalDays: number) => {
    const progression = dayIndex / totalDays;
    const trendMultiplier = 0.15 + progression * 0.85;
    const noise = Math.sin(dayIndex * 0.05) * 0.04 + Math.cos(dayIndex * 0.13) * 0.02;
    return base * trendMultiplier * (1 + noise);
  };

  let records: any[] = [];
  const batchSize = 1000;

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
        
        records.push({
          metal: 'gold',
          purity,
          city,
          currency: 'USD',
          price: priceUSD,
          timestamp: new Date(isoStr)
        });

        records.push({
          metal: 'gold',
          purity,
          city,
          currency: 'INR',
          price: priceUSD * 83.5,
          timestamp: new Date(isoStr)
        });
      });

      // Silver
      const silverBase = getTrendPrice(BASE_PRICES_USD.silver, daysToSeed - d, daysToSeed);
      const silverUSD = silverBase * locMult;
      
      records.push({
        metal: 'silver',
        purity: null,
        city,
        currency: 'USD',
        price: silverUSD,
        timestamp: new Date(isoStr)
      });

      records.push({
        metal: 'silver',
        purity: null,
        city,
        currency: 'INR',
        price: silverUSD * 83.5,
        timestamp: new Date(isoStr)
      });
    });

    if (records.length >= batchSize) {
      await prisma.priceHistory.createMany({ data: records });
      records = [];
      console.log(`Seeded ${d} days...`);
    }
  }

  if (records.length > 0) {
    await prisma.priceHistory.createMany({ data: records });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
