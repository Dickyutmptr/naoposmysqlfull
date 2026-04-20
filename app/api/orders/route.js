export const dynamic = 'force-dynamic';
import db from '../../../lib/db';
import { NextResponse } from 'next/server';

async function generateOrderId(connection) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: 'Asia/Jakarta'
    }).split('/').join('');

    const [lastOrders] = await connection.execute(
        'SELECT orderId FROM \`order\` WHERE orderId LIKE ? ORDER BY id DESC LIMIT 1',
        [`NB${dateStr}-%`]
    );

    let sequence = 1;
    if (lastOrders.length > 0) {
        const parts = lastOrders[0].orderId.split('-');
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

        let ordersQuery = 'SELECT * FROM \`order\`';
        let countQuery = 'SELECT COUNT(*) as total FROM \`order\`';
        const queryParams = [];

        if (search) {
            ordersQuery += ' WHERE orderId LIKE ?';
            countQuery += ' WHERE orderId LIKE ?';
            queryParams.push(`%${search}%`);
        }

        ordersQuery += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';

        // db.query supports dynamic binding
        const finalParams = [...queryParams, limit, skip];
        const [orders] = await db.query(ordersQuery, finalParams);
        const [countResult] = await db.query(countQuery, queryParams);
        const total = countResult[0].total;

        let items = [];
        if (orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            const [fetchedItems] = await db.query(`
                SELECT oi.*, p.name as productName, c.name as categoryName, c.id as categoryId 
                FROM orderitem oi 
                LEFT JOIN product p ON oi.productId = p.id 
                LEFT JOIN category c ON p.categoryId = c.id 
                WHERE oi.orderId IN (?)
            `, [orderIds]);
            items = fetchedItems;
        }

        const formatted = orders.map(o => {
            const orderItems = items.filter(i => i.orderId === o.id).map(i => ({
                name: i.productName || 'Produk Dihapus',
                qty: i.qty,
                note: i.note || '',
                product: {
                    name: i.productName || 'Produk Dihapus',
                    category: i.categoryId ? { id: i.categoryId, name: i.categoryName } : null,
                    kategori: i.categoryName || ''
                }
            }));

            return {
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
                items: orderItems,
                itemsSummary: orderItems.map(i => `${i.name} (${i.qty})`).join(', ')
            };
        });

        return NextResponse.json({
            data: formatted,
            meta: { total, page, lastPage: Math.ceil(total / limit) || 1, limit }
        });
    } catch (err) {
        console.error('Error fetching orders:', err);
        return NextResponse.json({ error: 'Failed to fetch orders', detail: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { cart, subtotal, tax, finalTotal, memberId, discount, serviceCharge, paymentMethod, cashGiven, serviceType, customerName, tableNumber, userId } = body;

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const item of cart) {
                const [productRows] = await connection.execute('SELECT id, name FROM product WHERE id = ?', [item.id]);
                if (productRows.length === 0) throw new Error(`Product ${item.nama || item.name} not found`);

                const [recipes] = await connection.execute('SELECT * FROM recipe WHERE productId = ?', [item.id]);

                if (recipes.length > 0) {
                    for (const recipe of recipes) {
                        const required = recipe.amount * item.qty;
                        const [ingredientRows] = await connection.execute('SELECT stock, name FROM ingredient WHERE id = ? FOR UPDATE', [recipe.ingredientId]);

                        if (ingredientRows.length === 0) {
                            throw new Error(`Bahan untuk ${productRows[0].name} tidak ditemukan`);
                        }
                        const ingredient = ingredientRows[0];

                        if (ingredient.stock < required) {
                            throw new Error(`Stok tidak cukup untuk ${ingredient.name}. Butuh: ${required}, Ada: ${ingredient.stock}`);
                        }
                    }
                }
            }

            let needsKitchen = false;
            let needsBar = false;

            for (const item of cart) {
                const [productRows] = await connection.execute('SELECT categoryId FROM product WHERE id = ?', [item.id]);
                if (productRows.length > 0) {
                    const categoryId = productRows[0].categoryId;
                    const [catRows] = await connection.execute('SELECT name FROM category WHERE id = ?', [categoryId]);
                    if (catRows.length > 0) {
                        const catStatus = catRows[0].name.toLowerCase().trim();
                        if (['makanan', 'snack', 'snacks', 'cemilan', 'makanan & snack', 'makanan dan snack'].includes(catStatus)) {
                            needsKitchen = true;
                        } else {
                            needsBar = true;
                        }
                    } else {
                        needsBar = true;
                    }
                }
            }

            const orderId = await generateOrderId(connection);
            const queueNumber = parseInt(orderId.split('-')[1]);
            const initialStatus = (!needsKitchen && !needsBar) ? 'completed' : 'pending';

            const [orderResult] = await connection.execute(
                `INSERT INTO \`order\` (
                    orderId, queueNumber, customerName, tableNumber, memberId, totalAmount, taxAmount, discountAmount, serviceCharge, finalAmount, paymentMethod, status, kitchenStatus, barStatus, userId, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    orderId, queueNumber, customerName || 'Guest', tableNumber ? String(tableNumber) : null, memberId || null,
                    subtotal || 0, tax || 0, discount || 0, serviceCharge || 0, finalTotal || 0, paymentMethod || 'cash',
                    initialStatus, needsKitchen ? 'pending' : 'done', needsBar ? 'pending' : 'done', userId || 1
                ]
            );

            const insertedOrderId = orderResult.insertId;

            for (const item of cart) {
                await connection.execute(
                    'INSERT INTO orderitem (orderId, productId, qty, price, note) VALUES (?, ?, ?, ?, ?)',
                    [insertedOrderId, item.id, item.qty, item.price, item.notes ? item.notes.join(', ') : '']
                );

                const [recipes] = await connection.execute('SELECT * FROM recipe WHERE productId = ?', [item.id]);
                if (recipes.length > 0) {
                    for (const recipe of recipes) {
                        await connection.execute(
                            'UPDATE ingredient SET stock = stock - ? WHERE id = ?',
                            [recipe.amount * item.qty, recipe.ingredientId]
                        );
                    }
                }
            }

            await connection.commit();

            return NextResponse.json({
                orderId: orderId,
                queueNumber: queueNumber
            }, { status: 201 });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { orderId, type } = body;

        if (!orderId || !type) {
            return NextResponse.json({ error: 'Missing orderId or type' }, { status: 400 });
        }

        const updateData = [];
        let queryUpdate = 'UPDATE \`order\` SET updatedAt = NOW()';

        if (type === 'kitchen') {
            queryUpdate += ", kitchenStatus = 'done'";
        }
        if (type === 'bar') {
            queryUpdate += ", barStatus = 'done'";
        }

        queryUpdate += ' WHERE orderId = ?';
        updateData.push(orderId);

        await db.execute(queryUpdate, updateData);

        const [orders] = await db.execute('SELECT * FROM \`order\` WHERE orderId = ?', [orderId]);
        const order = orders[0];
        let finalStatus = order.status;

        if (order.kitchenStatus === 'done' && order.barStatus === 'done') {
            finalStatus = 'completed';
            await db.execute('UPDATE \`order\` SET status = "completed" WHERE id = ?', [order.id]);
        }

        return NextResponse.json({ success: true, order: { ...order, status: finalStatus } });
    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
