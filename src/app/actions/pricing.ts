'use server';

import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/lib/auth-check';
import { revalidatePath } from 'next/cache';

export async function createSeason(formData: FormData) {
    const user = await verifyUser();
    if (user.role !== 'Admin') return { success: false, message: "Unauthorized." };

    const name = formData.get('name') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const priceMultiplier = parseFloat(formData.get('priceMultiplier') as string);

    if (!name || !startDate || !endDate || !priceMultiplier) {
        return { success: false, message: "Missing fields." };
    }

    try {
        await prisma.season.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                priceMultiplier
            }
        });
        revalidatePath('/settings');
        return { success: true, message: "Season created." };
    } catch (error) {
        return { success: false, message: "Failed to create season." };
    }
}

export async function getSeasons() {
    return await prisma.season.findMany({
        orderBy: { startDate: 'asc' }
    });
}

export async function deleteSeason(id: string) {
    const user = await verifyUser();
    if (user.role !== 'Admin') return { success: false, message: "Unauthorized." };

    try {
        await prisma.season.delete({ where: { id } });
        revalidatePath('/settings');
        return { success: true, message: "Season deleted." };
    } catch (error) {
        return { success: false, message: "Failed to delete season." };
    }
}
