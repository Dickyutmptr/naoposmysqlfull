export const dynamic = 'force-dynamic';
import db from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const [members] = await db.execute(`
            SELECT m.*, 
            (SELECT COUNT(*) FROM \`order\` o WHERE o.memberId = m.id AND o.status = 'completed') as _count_orders
            FROM member m 
            ORDER BY m.createdAt DESC
        `);

        // Format to match prisma struct
        const formatted = members.map(m => {
            const count = m._count_orders;
            delete m._count_orders;
            return {
                ...m,
                _count: { orders: count }
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Failed to fetch members', error);
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, phoneNumber, category, discount } = body;

        if (!name || !phoneNumber) {
            return NextResponse.json({ error: 'Name and Phone Number are required' }, { status: 400 });
        }

        const [existing] = await db.execute('SELECT id FROM member WHERE phoneNumber = ?', [phoneNumber]);
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Phone number already exists' }, { status: 409 });
        }

        const [result] = await db.execute(
            'INSERT INTO member (name, phoneNumber, category, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [name, phoneNumber, category || 'member', discount !== undefined ? parseFloat(discount) : 0]
        );

        const [newMember] = await db.execute('SELECT * FROM member WHERE id = ?', [result.insertId]);
        return NextResponse.json(newMember[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, phoneNumber, category, discount } = body;

        if (!id || !name || !phoneNumber) {
            return NextResponse.json({ error: 'ID, Name, and Phone Number are required' }, { status: 400 });
        }

        const [existing] = await db.execute('SELECT id FROM member WHERE phoneNumber = ?', [phoneNumber]);
        if (existing.length > 0 && existing[0].id !== parseInt(id)) {
            return NextResponse.json({ error: 'Phone number already exists' }, { status: 409 });
        }

        await db.execute(
            'UPDATE Member SET name = ?, phoneNumber = ?, category = ?, discount = ?, updatedAt = NOW() WHERE id = ?',
            [name, phoneNumber, category || 'member', discount !== undefined ? parseFloat(discount) : 0, parseInt(id)]
        );

        const [updatedMember] = await db.execute('SELECT * FROM member WHERE id = ?', [parseInt(id)]);
        return NextResponse.json(updatedMember[0]);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.execute('DELETE FROM member WHERE id = ?', [parseInt(id)]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
    }
}
