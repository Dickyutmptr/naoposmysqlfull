import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const members = await prisma.member.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: { where: { status: 'completed' } } }
                }
            }
        })
        return NextResponse.json(members)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { name, phoneNumber } = body

        if (!name || !phoneNumber) {
            return NextResponse.json({ error: 'Name and Phone Number are required' }, { status: 400 })
        }

        const newMember = await prisma.member.create({
            data: {
                name,
                phoneNumber,
            },
        })

        return NextResponse.json(newMember, { status: 201 })
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Phone number already exists' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.member.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
    }
}
