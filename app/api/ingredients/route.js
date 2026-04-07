import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const ingredients = await prisma.ingredient.findMany({
            orderBy: { name: 'asc' }
        });
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

        const ingredient = await prisma.ingredient.upsert({
            where: { name: name },
            update: {
                sku: sku || null,
                stock: parseFloat(stock),
                unit,
                minStockThreshold: parseFloat(minStockThreshold || 0),
                category: category || 'minuman'
            },
            create: {
                sku: sku || null,
                name,
                stock: parseFloat(stock),
                unit,
                minStockThreshold: parseFloat(minStockThreshold || 0),
                category: category || 'minuman'
            }
        });

        return NextResponse.json(ingredient);
    } catch (err) {
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
        await prisma.recipe.deleteMany({
            where: { ingredientId: ingredientId }
        });

        await prisma.ingredient.delete({
            where: { id: ingredientId }
        });

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

        const ingredient = await prisma.ingredient.update({
            where: { id: parseInt(id) },
            data: {
                sku: sku || null,
                name,
                stock: parseFloat(stock),
                unit,
                minStockThreshold: parseFloat(minStockThreshold || 0),
                category: category || 'minuman'
            }
        });

        return NextResponse.json(ingredient);
    } catch (err) {
        console.error('PUT Error:', err);
        return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 });
    }
}
