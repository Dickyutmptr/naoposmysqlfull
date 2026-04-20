export const dynamic = 'force-dynamic';
import db from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    const { id } = params;
    try {
        const body = await request.json();
        const { name, price, hpp, categoryId, image, recipes, isActive } = body;

        // Validate category exists
        const [cat] = await db.execute('SELECT id FROM category WHERE id = ?', [parseInt(categoryId)]);
        if (cat.length === 0) {
            return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 400 });
        }

        // Update Product
        await db.execute(
            'UPDATE product SET name = ?, price = ?, hpp = ?, categoryId = ?, image = ?, isActive = ?, updatedAt = NOW() WHERE id = ?',
            [name, parseFloat(price), parseFloat(hpp) || 0, parseInt(categoryId), image || '', isActive !== undefined ? (isActive ? 1 : 0) : 1, parseInt(id)]
        );

        // Update Recipes: Delete existing then re-create
        if (recipes) {
            await db.execute('DELETE FROM recipe WHERE productId = ?', [parseInt(id)]);
            for (const r of recipes) {
                await db.execute(
                    'INSERT INTO recipe (productId, ingredientId, amount) VALUES (?, ?, ?)',
                    [parseInt(id), parseInt(r.ingredientId), parseFloat(r.amount)]
                );
            }
        }

        const [updatedProduct] = await db.execute('SELECT * FROM product WHERE id = ?', [parseInt(id)]);
        return NextResponse.json(updatedProduct[0]);
    } catch (error) {
        console.error('Failed to update product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = params;
    try {
        // Soft Delete Product (Set isDeleted = true)
        await db.execute(
            'UPDATE product SET isDeleted = 1, isActive = 0, updatedAt = NOW() WHERE id = ?',
            [parseInt(id)]
        );

        return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Failed to delete product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
