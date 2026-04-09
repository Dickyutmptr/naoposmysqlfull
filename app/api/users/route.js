export const dynamic = 'force-dynamic';
import db from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const [users] = await db.execute('SELECT * FROM User ORDER BY createdAt DESC');
        return NextResponse.json(users);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed fetching users' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { username, password, name, role } = await req.json();

        // Check unique username
        const [existing] = await db.execute('SELECT id FROM User WHERE username = ?', [username]);
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Username sudah terpakai' }, { status: 400 });
        }

        const [result] = await db.execute(
            'INSERT INTO User (username, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [username, password, name, role || 'cashier']
        );

        const [newUser] = await db.execute('SELECT * FROM User WHERE id = ?', [result.insertId]);
        return NextResponse.json(newUser[0], { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed creating user' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { id, username, password, name, role } = await req.json();

        // Check if updating to a username that belongs to someone else
        const [existing] = await db.execute('SELECT id FROM User WHERE username = ?', [username]);
        if (existing.length > 0 && existing[0].id !== id) {
            return NextResponse.json({ error: 'Username sudah dipakai orang lain' }, { status: 400 });
        }

        if (password) {
            await db.execute(
                'UPDATE User SET username = ?, password = ?, name = ?, role = ?, updatedAt = NOW() WHERE id = ?',
                [username, password, name, role, id]
            );
        } else {
            await db.execute(
                'UPDATE User SET username = ?, name = ?, role = ?, updatedAt = NOW() WHERE id = ?',
                [username, name, role, id]
            );
        }

        const [updatedUser] = await db.execute('SELECT * FROM User WHERE id = ?', [id]);
        return NextResponse.json(updatedUser[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed updating user' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = parseInt(searchParams.get('id'));

        await db.execute('DELETE FROM User WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed deleting user' }, { status: 500 });
    }
}
