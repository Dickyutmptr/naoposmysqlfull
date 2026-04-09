export const dynamic = 'force-dynamic';
import db from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const [ingredients] = await db.execute('SELECT * FROM Ingredient ORDER BY name ASC');
        return NextResponse.json(ingredients);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { sku, name, stock, unit, minStockThreshold, category } = body;

        // Simple validation
        if (!name || stock === undefined || !unit) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [existing] = await db.execute('SELECT id FROM Ingredient WHERE name = ?', [name]);

        let ingredientId;
        if (existing.length > 0) {
            ingredientId = existing[0].id;
            await db.execute(
                'UPDATE Ingredient SET sku = ?, stock = ?, unit = ?, minStockThreshold = ?, category = ?, updatedAt = NOW() WHERE id = ?',
                [sku || null, parseFloat(stock), unit, parseFloat(minStockThreshold || 0), category || 'minuman', ingredientId]
            );
        } else {
            const [result] = await db.execute(
                'INSERT INTO Ingredient (sku, name, stock, unit, minStockThreshold, category, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [sku || null, name, parseFloat(stock), unit, parseFloat(minStockThreshold || 0), category || 'minuman']
            );
            ingredientId = result.insertId;
        }

        const [ingredient] = await db.execute('SELECT * FROM Ingredient WHERE id = ?', [ingredientId]);
        return NextResponse.json(ingredient[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to save ingredient' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const ingredientId = parseInt(id);

        // Delete associated recipes first (cascade manually)
        await db.execute('DELETE FROM Recipe WHERE ingredientId = ?', [ingredientId]);
        await db.execute('DELETE FROM Ingredient WHERE id = ?', [ingredientId]);

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, sku, name, stock, unit, minStockThreshold, category } = body;

        console.log('PUT received:', body);

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.execute(
            'UPDATE Ingredient SET sku = ?, name = ?, stock = ?, unit = ?, minStockThreshold = ?, category = ?, updatedAt = NOW() WHERE id = ?',
            [sku || null, name, parseFloat(stock), unit, parseFloat(minStockThreshold || 0), category || 'minuman', parseInt(id)]
        );

        const [ingredient] = await db.execute('SELECT * FROM Ingredient WHERE id = ?', [parseInt(id)]);
        return NextResponse.json(ingredient[0]);
    } catch (err) {
        console.error('PUT Error:', err);
        return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 });
    }
}
