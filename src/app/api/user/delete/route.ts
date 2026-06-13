import { NextResponse } from 'next/server';
import { prisma, executeSql } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const isPostgres = !!process.env.DATABASE_URL;

    if (isPostgres) {
      // Cascade delete is configured on database level in prisma
      await prisma.user.delete({
        where: { email }
      });
    } else {
      // Manual cascade delete for SQLite fallback
      const users = await prisma.user.findMany({ where: { email } });
      const userId = users[0]?.id;
      if (userId) {
        await executeSql('DELETE FROM alerts WHERE user_id = $1', [userId]);
        await executeSql('DELETE FROM watchlists WHERE user_id = $1', [userId]);
        await executeSql('DELETE FROM holdings WHERE user_id = $1', [userId]);
        await executeSql('DELETE FROM users WHERE id = $1', [userId]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete account', details: err.message }, { status: 500 });
  }
}
