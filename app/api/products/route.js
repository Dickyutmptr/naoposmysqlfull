import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isDeleted: false },
            include: {
                category: true,
                recipes: { include: { ingredient: true } }
            }
        });

        const productsWithStock = products.map(product => {
            let maxStock = Infinity;

            if (product.recipes.length > 0) {
                for (const r of product.recipes) {
                    if (!r.ingredient) continue;
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
                kategori: product.category ? product.category.name : '',
                stock: maxStock === Infinity ? 0 : maxStock,
                isAvailable: maxStock > 0 && maxStock !== Infinity && product.isActive
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
        const cat = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) }
        });

        if (!cat) {
            return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 400 });
        }

        // Create Product
        const newProduct = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                hpp: parseFloat(hpp) || 0,
                categoryId: cat.id,
                image: image || '',
                isActive: true
            }
        });

        // Create Recipes if any
        if (recipes && recipes.length > 0) {
            for (const r of recipes) {
                await prisma.recipe.create({
                    data: {
                        productId: newProduct.id,
                        ingredientId: parseInt(r.ingredientId),
                        amount: parseFloat(r.amount)
                    }
                });
            }
        }

        return NextResponse.json(newProduct);

    } catch (error) {
        console.error('Failed to create product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
