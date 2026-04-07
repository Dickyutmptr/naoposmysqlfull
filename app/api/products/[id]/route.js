import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
    const { id } = params;
    try {
        const body = await request.json();
        const { name, price, hpp, categoryId, image, recipes, isActive } = body;

        // Validate category exists
        const cat = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) }
        });

        if (!cat) {
            return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 400 });
        }

        // Update Product
        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                name,
                price: parseFloat(price),
                hpp: parseFloat(hpp) || 0,
                categoryId: cat.id,
                image: image || '',
                isActive: isActive !== undefined ? isActive : true
            }
        });

        // Update Recipes: Delete existing then re-create
        if (recipes) {
            await prisma.recipe.deleteMany({
                where: { productId: parseInt(id) }
            });

            for (const r of recipes) {
                await prisma.recipe.create({
                    data: {
                        productId: parseInt(id),
                        ingredientId: parseInt(r.ingredientId),
                        amount: parseFloat(r.amount)
                    }
                });
            }
        }

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Failed to update product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = params;
    try {
        // Soft Delete Product (Set isDeleted = true)
        await prisma.product.update({
            where: { id: parseInt(id) },
            data: { isDeleted: true, isActive: false }
        });

        return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Failed to delete product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
