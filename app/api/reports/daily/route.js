import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

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

        const reports = await prisma.report.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                user: {
                    select: { name: true, role: true }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(reports);
    } catch (error) {
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
        const image = formData.get('image'); // File object
        
        let imageUrl = null;

        if (!date || !category || !description || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (image && image.size > 0) {
            // Import inside function to avoid edge runtime issues if applicable, though it's node runtime by default
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

        const newReport = await prisma.report.create({
            data: {
                date: new Date(date),
                category,
                description,
                imageUrl,
                userId: parseInt(userId)
            }
        });

        return NextResponse.json(newReport, { status: 201 });
    } catch (error) {
        console.error('Failed to create report:', error);
        return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }
}
