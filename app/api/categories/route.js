export const dynamic = 'force-dynamic';
import db from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const [categories] = await db.execute('SELECT * FROM Category ORDER BY name ASC');
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
