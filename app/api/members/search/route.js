export const dynamic = 'force-dynamic';
import db from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const [members] = await db.execute(`
            SELECT m.*, 
            (SELECT COUNT(*) FROM \`Order\` o WHERE o.memberId = m.id AND o.status = 'completed') as _count_orders
            FROM Member m 
            WHERE m.name LIKE CONCAT('%', ?, '%') OR m.phoneNumber LIKE CONCAT('%', ?, '%')
            LIMIT 10
        `, [query, query]);

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
        console.error(error);
        return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
    }
}
