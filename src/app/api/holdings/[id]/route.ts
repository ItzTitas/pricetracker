import { NextResponse } from 'next/server';
import { prisma, executeSql } from '@/lib/db';
import { getServerSession } from 'next-auth';

const pgUrl = process.env.DATABASE_URL;
const isPostgres = !!pgUrl;

const demoUserId = 'demo-user-id';

// PUT update holding
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || demoUserId;
    const body = await request.json();
    const { id } = await params;

    const { metal, purity, weight, purchaseDate, purchasePrice, purchaseCity, notes, isArchived } = body;

    if (isPostgres) {
      const updatedHolding = await prisma.holding.update({
        where: { id, userId },
        data: {
          metal,
          purity,
          weight: weight ? parseFloat(weight) : undefined,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
          purchaseCity,
          notes,
          isArchived: isArchived !== undefined ? isArchived : undefined
        }
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_HOLDING',
          details: `Updated holding: ${id}`
        }
      });

      return NextResponse.json(updatedHolding);
    } else {
      // SQLite fallback
      await executeSql(
        `UPDATE holdings 
         SET metal = COALESCE($1, metal), 
             purity = COALESCE($2, purity), 
             weight = COALESCE($3, weight), 
             purchase_date = COALESCE($4, purchase_date), 
             purchase_price = COALESCE($5, purchase_price), 
             purchase_city = COALESCE($6, purchase_city), 
             notes = COALESCE($7, notes),
             is_archived = COALESCE($8, is_archived)
         WHERE id = $9 AND user_id = $10`,
        [
          metal || null,
          purity || null,
          weight ? parseFloat(weight) : null,
          purchaseDate || null,
          purchasePrice ? parseFloat(purchasePrice) : null,
          purchaseCity || null,
          notes || null,
          isArchived !== undefined ? (isArchived ? 1 : 0) : null,
          id,
          userId
        ]
      );

      await executeSql(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [Math.random().toString(36).substring(2, 15), userId, 'UPDATE_HOLDING', `Updated holding: ${id}`]
      );

      return NextResponse.json({ id, message: 'Holding updated successfully' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update holding', details: err.message }, { status: 500 });
  }
}

// DELETE holding
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || demoUserId;
    const { id } = await params;

    if (isPostgres) {
      await prisma.holding.delete({
        where: { id, userId }
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE_HOLDING',
          details: `Deleted holding: ${id}`
        }
      });
    } else {
      // SQLite fallback
      await executeSql('DELETE FROM holdings WHERE id = $1 AND user_id = $2', [id, userId]);
      await executeSql('DELETE FROM jewelry_items WHERE holding_id = $1', [id]);
      
      await executeSql(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [Math.random().toString(36).substring(2, 15), userId, 'DELETE_HOLDING', `Deleted holding: ${id}`]
      );
    }

    return NextResponse.json({ id, message: 'Holding deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete holding', details: err.message }, { status: 500 });
  }
}
