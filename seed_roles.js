const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding new roles...');

    const newUsers = [
        {
            username: 'headbar',
            password: '123',
            name: 'Head Bar',
            role: 'head_bar'
        },
        {
            username: 'assisten1',
            password: '123',
            name: 'Assisten Head',
            role: 'assisten_head'
        }
    ];

    for (const u of newUsers) {
        const existing = await prisma.user.findUnique({
            where: { username: u.username }
        });

        if (!existing) {
            await prisma.user.create({
                data: u
            });
            console.log(`Created user: ${u.username}`);
        } else {
            console.log(`User ${u.username} already exists. Skipping.`);
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    });
