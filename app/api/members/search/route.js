export const dynamic = 'force-dynamic';
import db from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        // Get total count
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total FROM member m
            WHERE m.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ?, '%') OR m.phoneNumber COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ?, '%')
        `, [query, query]);
        const totalCount = countResult[0].total;

        const [members] = await db.execute(`
            SELECT m.*, 
            (SELECT COUNT(*) FROM \`order\` o WHERE o.memberId = m.id AND o.status = 'completed') as _count_orders
            FROM member m 
            WHERE m.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ?, '%') OR m.phoneNumber COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ?, '%')
            LIMIT ? OFFSET ?
        `, [query, query, limit, offset]);

        const formatted = members.map(m => {
            const count = m._count_orders;
            delete m._count_orders;
            return {
                ...m,
                _count: { orders: count }
            };
        });

        return NextResponse.json({
            data: formatted,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            limit
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
    }
}
