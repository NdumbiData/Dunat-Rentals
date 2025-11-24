import { prisma } from '@/lib/prisma';
import BookingsClient from '@/components/BookingsClient';

export const dynamic = 'force-dynamic';

import { verifyUser } from '@/lib/auth-check';
import { redirect } from 'next/navigation';

export default async function BookingsPage() {
    try {
        const user = await verifyUser();

        const bookings = await prisma.booking.findMany({
            where: user.role === 'Owner' ? { car: { ownerId: user.id } } : {},
            include: {
                invoice: true,
                car: true // Include car to check ownership in client if needed
            }
        });
        const cars = await prisma.car.findMany({
            where: {
                deletedAt: null,
                ...(user.role === 'Owner' ? { ownerId: user.id } : {})
            }
        });

        return <BookingsClient initialBookings={bookings} cars={cars} />;
    } catch (error) {
        redirect('/login');
    }
}
