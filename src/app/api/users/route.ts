import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/lib/auth-check';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const user = await verifyUser();
        if (user.role !== 'Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        const where = role ? { role } : {};

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
