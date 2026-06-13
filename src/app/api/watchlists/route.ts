import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma, querySql, executeSql } from '@/lib/db';

const pgUrl = process.env.DATABASE_URL;
const isPostgres = !!pgUrl;

const demoUserId = 'demo-user-id';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || demoUserId;

    let list: any[] = [];
    if (isPostgres) {
      list = await prisma.watchlist.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      list = await querySql<any>('SELECT * FROM watchlists WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      list = list.map(item => ({
        id: item.id,
        userId: item.user_id,
        metal: item.metal,
        purity: item.purity,
        city: item.city,
        createdAt: item.created_at
      }));
    }

    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch watchlist', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || demoUserId;
    const body = await request.json();
    const { metal, purity, city } = body;

    if (!metal || !city) {
      return NextResponse.json({ error: 'Missing metal or city' }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(2, 15);

    if (isPostgres) {
      const newItem = await prisma.watchlist.create({
        data: { id, userId, metal, purity, city }
      });
      return NextResponse.json(newItem);
    } else {
      await executeSql(
        'INSERT INTO watchlists (id, user_id, metal, purity, city) VALUES ($1, $2, $3, $4, $5)',
        [id, userId, metal, purity || null, city]
      );
      return NextResponse.json({ id, userId, metal, purity, city });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to add to watchlist', details: err.message }, { status: 500 });
  }
}
