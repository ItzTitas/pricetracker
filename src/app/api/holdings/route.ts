import { NextResponse } from 'next/server';
import { prisma, querySql, executeSql } from '@/lib/db';
import { getServerSession } from 'next-auth';

const pgUrl = process.env.DATABASE_URL;
const isPostgres = !!pgUrl;

const demoUserId = 'demo-user-id';

// GET all holdings
export async function GET() {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || demoUserId;

    let holdings: any[] = [];

    if (isPostgres) {
      holdings = await prisma.holding.findMany({
        where: { userId, isArchived: false },
        include: { jewelryItems: true },
        orderBy: { purchaseDate: 'desc' }
      });
    } else {
      // Fallback to SQLite
      const rows = await querySql<any>(
        'SELECT * FROM holdings WHERE user_id = $1 AND is_archived = 0 ORDER BY purchase_date DESC',
        [userId]
      );
      
      // Get jewelry items for each holding
      for (const row of rows) {
        const items = await querySql<any>(
          'SELECT * FROM jewelry_items WHERE holding_id = $1',
          [row.id]
        );
        holdings.push({
          id: row.id,
          userId: row.user_id,
          metal: row.metal,
          purity: row.purity,
          weight: row.weight,
          purchaseDate: row.purchase_date,
          purchasePrice: row.purchase_price,
          purchaseCity: row.purchase_city,
          notes: row.notes,
          isArchived: row.is_archived === 1,
          jewelryItems: items.map(item => ({
            id: item.id,
            holdingId: item.holding_id,
            itemName: item.item_name,
            jewelryType: item.jewelry_type,
            weight: item.weight,
            purity: item.purity,
            purchasePrice: item.purchase_price,
            purchaseDate: item.purchase_date,
            notes: item.notes
          }))
        });
      }
    }

    return NextResponse.json(holdings);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch holdings', details: err.message }, { status: 500 });
  }
}

// POST new holding
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || demoUserId;
    const body = await request.json();

    const { metal, purity, weight, purchaseDate, purchasePrice, purchaseCity, notes, jewelryItems } = body;

    if (!metal || !purity || !weight || !purchaseDate || !purchasePrice || !purchaseCity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const holdingId = Math.random().toString(36).substring(2, 15);

    if (isPostgres) {
      const newHolding = await prisma.holding.create({
        data: {
          id: holdingId,
          userId,
          metal,
          purity,
          weight: parseFloat(weight),
          purchaseDate: new Date(purchaseDate),
          purchasePrice: parseFloat(purchasePrice),
          purchaseCity,
          notes,
          jewelryItems: jewelryItems && jewelryItems.length > 0 ? {
            create: jewelryItems.map((item: any) => ({
              itemName: item.itemName,
              jewelryType: item.jewelryType,
              weight: parseFloat(item.weight),
              purity: item.purity || purity,
              purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : null,
              purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : null,
              notes: item.notes
            }))
          } : undefined
        },
        include: { jewelryItems: true }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_HOLDING',
          details: `Created holding: ${metal} (${purity}), ${weight}g`
        }
      });

      return NextResponse.json(newHolding);
    } else {
      // Fallback SQLite insertion
      await executeSql(
        `INSERT INTO holdings (id, user_id, metal, purity, weight, purchase_date, purchase_price, purchase_city, notes, is_archived)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)`,
        [holdingId, userId, metal, purity, parseFloat(weight), purchaseDate, parseFloat(purchasePrice), purchaseCity, notes]
      );

      const items: any[] = [];
      if (jewelryItems && jewelryItems.length > 0) {
        for (const item of jewelryItems) {
          const itemId = Math.random().toString(36).substring(2, 15);
          await executeSql(
            `INSERT INTO jewelry_items (id, holding_id, item_name, jewelry_type, weight, purity, purchase_price, purchase_date, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              itemId,
              holdingId,
              item.itemName,
              item.jewelryType,
              parseFloat(item.weight),
              item.purity || purity,
              item.purchasePrice ? parseFloat(item.purchasePrice) : null,
              item.purchaseDate || null,
              item.notes || null
            ]
          );
          items.push({ id: itemId, holdingId, ...item });
        }
      }

      await executeSql(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [Math.random().toString(36).substring(2, 15), userId, 'CREATE_HOLDING', `Created holding: ${metal} (${purity}), ${weight}g`]
      );

      return NextResponse.json({
        id: holdingId,
        userId,
        metal,
        purity,
        weight: parseFloat(weight),
        purchaseDate,
        purchasePrice: parseFloat(purchasePrice),
        purchaseCity,
        notes,
        isArchived: false,
        jewelryItems: items
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create holding', details: err.message }, { status: 500 });
  }
}
