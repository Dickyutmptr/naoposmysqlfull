const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Add-ons...');
    
    // 1. Ensure 'Add-on' category exists
    let addonCategory = await prisma.category.findUnique({
        where: { name: 'Add-on' }
    });

    if (!addonCategory) {
        addonCategory = await prisma.category.create({
            data: { name: 'Add-on' }
        });
        console.log('Created Add-on Category');
    }

    // 2. The 5 add-ons requested
    const addOns = [
        'Matcha Foam',
        'Coconut Foam',
        'Strawberry Foam',
        'Cream Cheese',
        'Coffee Foam'
    ];

    for (const name of addOns) {
        // Create product if it doesn't exist
        const existing = await prisma.product.findFirst({
            where: { name, categoryId: addonCategory.id }
        });

        if (!existing) {
            await prisma.product.create({
                data: {
                    name,
                    price: 10000,
                    hpp: 0,
                    categoryId: addonCategory.id,
                    isActive: true,
                    isDeleted: false
                }
            });
            console.log(`Created product: ${name}`);
        } else {
            // Update to exactly 10000 if already exists
            await prisma.product.update({
                where: { id: existing.id },
                data: { price: 10000 }
            });
            console.log(`Updated product price: ${name}`);
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
