export const dynamic = 'force-dynamic';
import db from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        if (!startDateStr || !endDateStr) {
            return NextResponse.json({ error: 'Start date and End date are required' }, { status: 400 });
        }

        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);

        const [reports] = await db.execute(`
            SELECT r.*, u.name as userName, u.role as userRole 
            FROM Report r 
            LEFT JOIN User u ON r.userId = u.id 
            WHERE r.date >= ? AND r.date <= ?
            ORDER BY r.date DESC
        `, [start, end]);

        const formatted = reports.map(r => ({
            ...r,
            user: { name: r.userName, role: r.userRole }
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const date = formData.get('date');
        const category = formData.get('category');
        const description = formData.get('description');
        const userId = formData.get('userId');
        const image = formData.get('image');

        let imageUrl = null;

        if (!date || !category || !description || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (image && image.size > 0) {
            const { writeFile, mkdir } = await import('fs/promises');
            const { join } = await import('path');

            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadDir = join(process.cwd(), 'public', 'uploads');
            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) {
                // Ignore if exists
            }

            const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const filepath = join(uploadDir, filename);
            await writeFile(filepath, buffer);
            imageUrl = `/uploads/${filename}`;
        }

        const formattedDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');

        const [result] = await db.execute(
            'INSERT INTO Report (date, category, description, imageUrl, userId) VALUES (?, ?, ?, ?, ?)',
            [formattedDate, category, description, imageUrl, parseInt(userId)]
        );

        const [newReport] = await db.execute('SELECT * FROM Report WHERE id = ?', [result.insertId]);

        return NextResponse.json(newReport[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create report:', error);
        return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }
}
