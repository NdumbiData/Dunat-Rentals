import { prisma } from '@/lib/prisma';
import FleetClient from '@/components/FleetClient';
import { Car, ServiceRecord } from '@prisma/client';
import { getCurrentUser } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function FleetPage() {
    const user = await getCurrentUser();

    const cars = await prisma.car.findMany({
        where: {
            deletedAt: null,
            ...(user?.role === 'Owner' ? { ownerId: user.id } : {})
        },
        include: {
            serviceHistory: true
        }
    });

    const owners = await prisma.user.findMany({
        where: { role: 'Owner' },
        select: { id: true, name: true }
    });

    // Transform data to match Client Component props (parse JSON)
    const formattedCars = cars.map((car: Car & { serviceHistory: ServiceRecord[] }) => ({
        ...car,
        serviceHistory: car.serviceHistory.map((s: ServiceRecord) => {
            let parts: string[] = [];
            try {
                parts = JSON.parse(s.partsReplaced) as string[];
            } catch (e) {
                // Fallback for legacy plain text data
                parts = s.partsReplaced ? s.partsReplaced.split(',').map(p => p.trim()) : [];
            }
            return {
                ...s,
                partsReplaced: parts
            };
        })
    }));

    return <FleetClient initialCars={formattedCars} owners={owners} />;
}
