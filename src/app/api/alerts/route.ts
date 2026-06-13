import { NextResponse } from 'next/server';
import { prisma, querySql, executeSql } from '@/lib/db';
import { getServerSession } from 'next-auth';

const pgUrl = process.env.DATABASE_URL;
const isPostgres = !!pgUrl;

const demoUserId = 'demo-user-id';

export async function GET() {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || demoUserId;

    let list: any[] = [];
    if (isPostgres) {
      list = await prisma.alert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      list = await querySql<any>('SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      list = list.map(item => ({
        id: item.id,
        userId: item.user_id,
        metal: item.metal,
        purity: item.purity,
        condition: item.condition,
        targetPrice: item.target_price,
        isTriggered: item.is_triggered === 1,
        createdAt: item.created_at
      }));
    }

    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch alerts', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || demoUserId;
    const body = await request.json();
    const { metal, purity, condition, targetPrice } = body;

    if (!metal || !condition || !targetPrice) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(2, 15);

    if (isPostgres) {
      const newAlert = await prisma.alert.create({
        data: {
          id,
          userId,
          metal,
          purity,
          condition,
          targetPrice: parseFloat(targetPrice)
        }
      });
      return NextResponse.json(newAlert);
    } else {
      await executeSql(
        'INSERT INTO alerts (id, user_id, metal, purity, condition, target_price, is_triggered) VALUES ($1, $2, $3, $4, $5, $6, 0)',
        [id, userId, metal, purity || null, condition, parseFloat(targetPrice)]
      );
      return NextResponse.json({ id, userId, metal, purity, condition, targetPrice: parseFloat(targetPrice), isTriggered: false });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create alert', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || demoUserId;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing alert ID' }, { status: 400 });
    }

    if (isPostgres) {
      await prisma.alert.deleteMany({
        where: { id, userId }
      });
    } else {
      await executeSql('DELETE FROM alerts WHERE id = $1 AND user_id = $2', [id, userId]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete alert', details: err.message }, { status: 500 });
  }
}

