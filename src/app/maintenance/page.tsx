import { prisma } from '@/lib/prisma';
import MaintenanceClient from '@/components/MaintenanceClient';
import { verifyUser } from '@/lib/auth-check';

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default async function MaintenancePage() {
    const user = await verifyUser();

    const whereClause = user.role === 'Owner' ? { ownerId: user.id } : {};

    const cars = await prisma.car.findMany({
        where: whereClause,
        include: {
            serviceHistory: true,
            expenses: true
        }
    });

    const expenses = await prisma.expense.findMany({
        where: user.role === 'Owner' ? { car: { ownerId: user.id } } : {},
        include: { car: true }
    });

    const serviceRecords = await prisma.serviceRecord.findMany({
        where: user.role === 'Owner' ? { car: { ownerId: user.id } } : {},
        include: { car: true }
    });

    return (
        <MaintenanceClient
            initialCars={cars}
            initialExpenses={expenses}
            initialServiceRecords={serviceRecords}
        />
    );
}
