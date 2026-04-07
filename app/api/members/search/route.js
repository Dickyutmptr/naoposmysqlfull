import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    try {
        const members = await prisma.member.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { phoneNumber: { contains: query } }
                ]
            },
            take: 10,
            include: {
                _count: {
                    select: { orders: { where: { status: 'completed' } } }
                }
            }
        })
        return NextResponse.json(members)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to search members' }, { status: 500 })
    }
}
