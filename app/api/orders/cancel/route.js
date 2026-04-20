export const dynamic = 'force-dynamic';
import db from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { orderId, cancelReason, cancelNote } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [orderRows] = await connection.execute('SELECT * FROM \`order\` WHERE orderId = ?', [orderId]);
            if (orderRows.length === 0) throw new Error('Order not found');
            const order = orderRows[0];

            if (order.status === 'cancelled') throw new Error('Order is already cancelled');
            if (order.status === 'completed') throw new Error('Order is already completed and cannot be cancelled');

            const [items] = await connection.execute('SELECT * FROM orderitem WHERE orderId = ?', [order.id]);

            for (const item of items) {
                const [recipes] = await connection.execute('SELECT * FROM recipe WHERE productId = ?', [item.productId]);
                if (recipes.length > 0) {
                    for (const recipe of recipes) {
                        await connection.execute(
                            'UPDATE ingredient SET stock = stock + ? WHERE id = ?',
                            [recipe.amount * item.qty, recipe.ingredientId]
                        );
                    }
                }
            }

            await connection.execute(
                'UPDATE \`order\` SET status = "cancelled", kitchenStatus = "cancelled", barStatus = "cancelled", cancelReason = ?, cancelNote = ?, updatedAt = NOW() WHERE id = ?',
                [cancelReason || null, cancelNote || null, order.id]
            );

            const reportDesc = `Pembatalan Pesanan ${orderId}. Alasan: ${cancelReason || 'Lainya'}${cancelNote ? ` - "${cancelNote}"` : ''}`;
            await connection.execute(
                'INSERT INTO report (category, description, userId, date) VALUES (?, ?, ?, NOW())',
                ['Kasir', reportDesc, order.userId || 1]
            );

            await connection.commit();
            return NextResponse.json({ success: true, order: { ...order, status: 'cancelled' } });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Cancellation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
