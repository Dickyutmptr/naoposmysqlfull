import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();



export async function POST(request) {
    try {
        const { orderId, cancelReason, cancelNote } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Find the order and its items
            // We use findFirst because orderId is a string field, not the primary key 'id'
            const order = await tx.order.findFirst({
                where: { orderId: orderId },
                include: { items: { include: { product: { include: { category: true } } } } }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status === 'cancelled') {
                throw new Error('Order is already cancelled');
            }
            if (order.status === 'completed') {
                throw new Error('Order is already completed and cannot be cancelled');
            }

            // 2. Restore Stock
            // Loop through items and add back ingredients dynamically from DB
            for (const item of order.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId || item.product.id },
                    include: { recipes: true }
                });

                if (product && product.recipes && product.recipes.length > 0) {
                    for (const recipe of product.recipes) {
                        await tx.ingredient.update({
                            where: { id: recipe.ingredientId },
                            data: {
                                stock: { increment: recipe.amount * item.qty }
                            }
                        });
                    }
                }
            }

            // 3. Update Status
            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    status: 'cancelled',
                    kitchenStatus: 'cancelled',
                    barStatus: 'cancelled',
                    cancelReason: cancelReason || null,
                    cancelNote: cancelNote || null
                }
            });

            // 4. Create Report for Cancellation
            const reportDesc = `Pembatalan Pesanan ${orderId}. Alasan: ${cancelReason || 'Lainya'}${cancelNote ? ` - "${cancelNote}"` : ''}`;
            await tx.report.create({
                data: {
                    category: 'Kasir',
                    description: reportDesc,
                    userId: order.userId || 1
                }
            });

            return updatedOrder;
        });

        return NextResponse.json({ success: true, order: result });

    } catch (error) {
        console.error('Cancellation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
