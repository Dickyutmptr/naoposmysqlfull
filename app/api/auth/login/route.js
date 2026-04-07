import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
    try {
        const { username, password } = await req.json();

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user || user.password !== password) { // Simple password check for now
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Return user info excluding password
        return NextResponse.json({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
