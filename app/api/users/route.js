import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
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
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json({ error: 'Username sudah terpakai' }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: { username, password, name, role }
        });

        return NextResponse.json(user, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed creating user' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { id, username, password, name, role } = await req.json();

        // Check if updating to a username that belongs to someone else
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing && existing.id !== id) {
            return NextResponse.json({ error: 'Username sudah dipakai orang lain' }, { status: 400 });
        }

        const dataToUpdate = { username, name, role };
        // Valid for password edit
        if (password) {
            dataToUpdate.password = password;
        }

        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(user);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed updating user' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = parseInt(searchParams.get('id'));

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed deleting user' }, { status: 500 });
    }
}
