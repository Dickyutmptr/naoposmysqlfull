import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Hardcoded Recipes as requested
const RECIPES = {
    'Kopi Susu Gula Aren': { 'Kopi Beans': 15, 'Gula Aren': 20, 'Susu Cair': 100 },
    'Bubble Gum': { 'Bubble Gum Powder': 30, 'Susu Cair': 50 },
    'Americano': { 'Kopi Beans': 15 },
    'Cappuccino': { 'Kopi Beans': 20 },
    'French Fries': { 'Kentang': 100 },
    'Nasi Goreng Spesial': { 'Beras': 150, 'Ayam': 50, 'Kecap Manis': 20 },
    'Indomie Goreng': { 'Indomie': 1, 'Kecap Manis': 10 }
};

// Helper to generate Order ID: NB{DD}{MM}{YY}-{XXX}
async function generateOrderId() {
    const now = new Date();

    // Use Jakarta Time for Order ID Date Part
    const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: 'Asia/Jakarta'
    }).split('/').join(''); // 11/02/24 -> 110224

    // Find last order for today to increment
    const lastOrder = await prisma.order.findFirst({
        where: {
            orderId: {
                startsWith: `NB${dateStr}`
            }
        },
        orderBy: {
            id: 'desc'
        }
    });

    let sequence = 1;
    if (lastOrder) {
        const parts = lastOrder.orderId.split('-');
        if (parts.length === 2) {
            sequence = parseInt(parts[1]) + 1;
        }
    }

    return `NB${dateStr}-${String(sequence).padStart(3, '0')}`;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        const whereClause = {};
        if (search) {
            whereClause.orderId = { contains: search };
        }

        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: limit,
                include: {
                    items: {
                        include: {
                            product: {
                                include: { category: true }
                            }
                        }
                    }
                }
            }),
            prisma.order.count({ where: whereClause })
        ]);

        const formatted = orders.map(o => ({
            id: o.orderId,
            orderId: o.orderId,
            queueNumber: o.queueNumber,
            date: new Date(o.createdAt).toLocaleString('id-ID'),
            total: o.finalAmount,
            status: o.status,
            kitchenStatus: o.kitchenStatus,
            barStatus: o.barStatus,
            customerName: o.customerName,
            tableNumber: o.tableNumber,
            cancelReason: o.cancelReason,
            cancelNote: o.cancelNote,
            createdAt: o.createdAt,
            // Full items for KitchenBar - safe with optional chaining for deleted products
            items: (o.items || []).map(i => ({
                name: i.product?.name || 'Produk Dihapus',
                qty: i.qty,
                note: i.note || '',
                product: {
                    name: i.product?.name || 'Produk Dihapus',
                    category: i.product?.category || null,
                    kategori: i.product?.category?.name || ''
                }
            })),
            // String summary for History
            itemsSummary: (o.items || []).map(i => `${i.product?.name || 'Produk Dihapus'} (${i.qty})`).join(', ')
        }));

        return NextResponse.json({
            data: formatted,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit) || 1,
                limit
            }
        });
    } catch (err) {
        console.error('[GET /api/orders] Error:', err.message, err.stack);
        return NextResponse.json({ error: 'Failed to fetch orders', detail: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { cart, subtotal, tax, finalTotal, memberId, discount, serviceCharge, paymentMethod, cashGiven, serviceType, customerName, tableNumber, userId } = body;

        console.log('[ORDER POST] Received body:', JSON.stringify({ cart: cart?.length, customerName, tableNumber, userId, finalTotal }));

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // Transaction: Create Order -> Create Items -> Deduct Stock
        const result = await prisma.$transaction(async (tx) => {
            // ... (packaging logic remains same)

            for (const item of cart) {
                // Fetch product WITH recipes -> ingredients
                const product = await tx.product.findUnique({
                    where: { id: item.id },
                    include: {
                        category: true,
                        recipes: { include: { ingredient: true } }
                    }
                });

                if (!product) throw new Error(`Product ${item.nama} not found`);

                // Dynamic Stock Check
                if (product.recipes && product.recipes.length > 0) {
                    for (const recipe of product.recipes) {
                        const required = recipe.amount * item.qty;
                        // Determine current stock from the recipe's ingredient relation
                        // (Note: recipe.ingredient gives us the state at time of fetch, 
                        // but for specific row locking or re-fetching, usually safer to fetch ingredient fresh 
                        // or rely on the loaded data if concurrency is low. 
                        // To be safe and adhere to previous logic, let's fetch ingredient row to get latest stock)

                        const ingredient = await tx.ingredient.findUnique({ where: { id: recipe.ingredientId } });

                        if (!ingredient) {
                            throw new Error(`Bahan untuk ${product.name} tidak ditemukan`);
                        }

                        if (ingredient.stock < required) {
                            throw new Error(`Stok tidak cukup untuk ${ingredient.name}. Butuh: ${required}, Ada: ${ingredient.stock}`);
                        }
                    }
                }
            }


            // 1. Check Station Requirement
            // Determine if Kitchen or Bar is needed based on items
            // Kitchen: makanan, cemilan directly mapped from product category
            // Bar: coffee, non-coffee, minuman
            let needsKitchen = false;
            let needsBar = false;

            for (const item of cart) {
                const product = await tx.product.findUnique({ where: { id: item.id }, include: { category: true } });
                if (product) {
                    const cat = product.category ? product.category.name.toLowerCase() : '';
                    // Kitchen: Makanan, Snack, Cemilan
                    if (['makanan', 'snack', 'cemilan'].includes(cat)) {
                        needsKitchen = true;
                    }
                    // Bar: semua jenis minuman
                    else if (cat.includes('coffee') || cat.includes('matcha') || cat.includes('chocolate') || cat.includes('choco') || cat.includes('coconut') || ['non-coffee', 'minuman'].includes(cat)) {
                        needsBar = true;
                    }
                }
            }

            // 2. Generate ID
            const orderId = await generateOrderId();

            // 3. Create Order
            const initialStatus = (!needsKitchen && !needsBar) ? 'completed' : 'pending';

            const newOrder = await tx.order.create({
                data: {
                    orderId,
                    queueNumber: parseInt(orderId.split('-')[1]),
                    customerName: customerName || 'Guest',
                    tableNumber: tableNumber ? String(tableNumber) : null,
                    totalAmount: subtotal || 0,
                    taxAmount: tax || 0,
                    discountAmount: discount || 0,
                    serviceCharge: serviceCharge || 0,
                    finalAmount: finalTotal || 0,
                    paymentMethod: paymentMethod || 'cash',
                    status: initialStatus,
                    kitchenStatus: needsKitchen ? 'pending' : 'done',
                    barStatus: needsBar ? 'pending' : 'done',
                    userId: userId || 1,
                    memberId: memberId || null
                }
            });

            // 4. Create OrderItems & Deduct Stock
            for (const item of cart) {
                // Create Item
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: item.id,
                        qty: item.qty,
                        price: item.price,
                        note: item.notes ? item.notes.join(', ') : ''
                    }
                });

                // Deduct Ingredients
                const product = await tx.product.findUnique({
                    where: { id: item.id },
                    include: { recipes: true }
                });

                if (product.recipes && product.recipes.length > 0) {
                    for (const recipe of product.recipes) {
                        await tx.ingredient.update({
                            where: { id: recipe.ingredientId },
                            data: {
                                stock: { decrement: recipe.amount * item.qty }
                            }
                        });
                    }
                }
            }

            return newOrder;
        });

        // Return orderId and queueNumber so POS.js can use them for receipt printing
        return NextResponse.json({
            ...result,
            orderId: result.orderId,
            queueNumber: result.queueNumber
        }, { status: 201 });
    } catch (error) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { orderId, type } = body; // type: 'kitchen' or 'bar'

        if (!orderId || !type) {
            return NextResponse.json({ error: 'Missing orderId or type' }, { status: 400 });
        }

        const updateData = {};
        if (type === 'kitchen') updateData.kitchenStatus = 'done';
        if (type === 'bar') updateData.barStatus = 'done';

        // 1. Update the station status
        // We use orderId string for finding, but update needs unique ID if using `update`? 
        // Nope, `update` works with unique fields. `orderId` should be unique ideally. 
        // Prisma schema defines orderId as unique? Let's assume so or use findFirst + update id.
        // Previously we used `where: { orderId: orderId }`.

        const order = await prisma.order.update({
            where: { orderId: orderId },
            data: updateData
        });

        // 2. Check if order is fully complete
        // Since we updated one part, check if the OTHER part is also done.
        // We can check the returned `order` object directly if we assume it returns updated fields.
        // Prisma `update` returns the updated object.

        let finalStatus = order.status;

        if (order.kitchenStatus === 'done' && order.barStatus === 'done') {
            finalStatus = 'completed';
            // Update main status
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'completed' }
            });
        }

        return NextResponse.json({ success: true, order: { ...order, status: finalStatus } });
    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
