import { prisma } from '@/lib/prisma';
import PaymentsClient from '@/components/PaymentsClient';

export const dynamic = 'force-dynamic';

import { verifyUser } from '@/lib/auth-check';
import { redirect } from 'next/navigation';

export default async function PaymentsPage() {
    try {
        await verifyUser();
    } catch (error) {
        redirect('/login');
    }
    const payments = await prisma.payment.findMany();
    const bookings = await prisma.booking.findMany({
        include: {
            invoice: true
        }
    });
    const cars = await prisma.car.findMany();

    return <PaymentsClient initialPayments={payments} bookings={bookings} cars={cars} />;
}
