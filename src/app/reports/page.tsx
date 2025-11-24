import { prisma } from '@/lib/prisma';
import ReportsClient from '@/components/ReportsClient';
import { Car, ServiceRecord } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
    const payments = await prisma.payment.findMany({
        include: {
            booking: true
        }
    });
    const cars = await prisma.car.findMany({
        include: {
            serviceHistory: true
        }
    });

    const expenses = await prisma.expense.findMany();

    // Transform data to match Client Component props (parse JSON)
    const formattedCars = cars.map((car: Car & { serviceHistory: ServiceRecord[] }) => ({
        ...car,
        serviceHistory: car.serviceHistory.map((s: ServiceRecord) => {
            let parts: string[] = [];
            try {
                parts = JSON.parse(s.partsReplaced) as string[];
            } catch (e) {
                parts = s.partsReplaced ? s.partsReplaced.split(',').map(p => p.trim()) : [];
            }
            return {
                ...s,
                partsReplaced: parts
            };
        })
    }));

    const bookings = await prisma.booking.findMany();

    return <ReportsClient payments={payments} cars={formattedCars} expenses={expenses} bookings={bookings} />;
}
