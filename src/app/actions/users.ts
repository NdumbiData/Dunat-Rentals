'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

export async function getUsers() {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'Admin') {
        throw new Error('Unauthorized');
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return users;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw new Error('Failed to fetch users');
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'Admin') {
        return { success: false, message: 'Unauthorized' };
    }

    if (newRole !== 'Admin' && newRole !== 'Owner') {
        return { success: false, message: 'Invalid role' };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        revalidatePath('/users');
        return { success: true, message: 'User role updated successfully' };
    } catch (error) {
        console.error('Failed to update user role:', error);
        return { success: false, message: 'Failed to update user role' };
    }
}
