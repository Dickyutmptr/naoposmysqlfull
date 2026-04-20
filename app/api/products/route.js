export const dynamic = 'force-dynamic';
import db from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const [products] = await db.execute('SELECT p.*, c.name as categoryName FROM product p LEFT JOIN category c ON p.categoryId = c.id WHERE p.isDeleted = 0');
        const [recipes] = await db.execute('SELECT r.*, i.stock as ingredientStock, i.name as ingredientName FROM recipe r LEFT JOIN ingredient i ON r.ingredientId = i.id');

        const productsWithStock = products.map(product => {
            let maxStock = Infinity;

            const productRecipes = recipes.filter(r => r.productId === product.id);

            const mappedRecipes = productRecipes.map(r => ({
                id: r.id,
                productId: r.productId,
                ingredientId: r.ingredientId,
                amount: r.amount,
                ingredient: {
                    id: r.ingredientId,
                    name: r.ingredientName,
                    stock: r.ingredientStock
                }
            }));

            if (mappedRecipes.length > 0) {
                for (const r of mappedRecipes) {
                    if (r.ingredient.stock === null || r.ingredient.stock === undefined) continue;
                    const possible = Math.floor(r.ingredient.stock / r.amount);
                    if (possible < maxStock) {
                        maxStock = possible;
                    }
                }
            } else {
                // If no recipe, assume unlimited or manage manually
                maxStock = 999;
            }

            return {
                ...product,
                category: product.categoryId ? { id: product.categoryId, name: product.categoryName } : null,
                recipes: mappedRecipes,
                kategori: product.categoryName ? product.categoryName : '',
                stock: maxStock === Infinity ? 0 : maxStock,
                isAvailable: maxStock > 0 && maxStock !== Infinity && !!product.isActive
            };
        });

        return NextResponse.json(productsWithStock);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, price, hpp, categoryId, image, recipes } = body;

        // Validate category exists
        const [cat] = await db.execute('SELECT id FROM category WHERE id = ?', [parseInt(categoryId)]);
        if (cat.length === 0) {
            return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 400 });
        }

        // Create Product
        const [result] = await db.execute(
            'INSERT INTO product (name, price, hpp, categoryId, image, isActive, isDeleted, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, 0, NOW(), NOW())',
            [name, parseFloat(price), parseFloat(hpp) || 0, parseInt(categoryId), image || '']
        );
        const productId = result.insertId;

        // Create Recipes if any
        if (recipes && recipes.length > 0) {
            for (const r of recipes) {
                await db.execute(
                    'INSERT INTO recipe (productId, ingredientId, amount) VALUES (?, ?, ?)',
                    [productId, parseInt(r.ingredientId), parseFloat(r.amount)]
                );
            }
        }

        const [newProduct] = await db.execute('SELECT * FROM product WHERE id = ?', [productId]);
        return NextResponse.json(newProduct[0]);

    } catch (error) {
        console.error('Failed to create product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
