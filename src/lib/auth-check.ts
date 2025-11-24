import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

export class AuthenticationError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export async function verifyUser(): Promise<User> {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;

    if (!userId) {
        throw new AuthenticationError('No session found');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AuthenticationError('User not found');
    }

    return user;
}

export async function verifyAdmin(): Promise<User> {
    const user = await verifyUser();
    // SuperAdmin (admin@rentals.com) has all Admin privileges
    if (user.role !== 'Admin' && user.email !== 'admin@rentals.com') {
        throw new AuthenticationError('Admin access required');
    }
    return user;
}

export async function verifySuperAdmin(): Promise<User> {
    const user = await verifyUser();
    if (user.email !== 'admin@rentals.com') {
        throw new AuthenticationError('SuperAdmin access required');
    }
    return user;
}
