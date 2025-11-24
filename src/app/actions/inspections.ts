'use server';

import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/lib/auth-check';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const inspectionSchema = z.object({
    bookingId: z.string(),
    type: z.enum(['Check-out', 'Check-in']),
    fuelLevel: z.number().min(0).max(1),
    mileage: z.number().min(0),
    photos: z.array(z.string()), // Array of URLs
    damagePoints: z.array(z.object({
        x: z.number(),
        y: z.number(),
        note: z.string().optional()
    })),
    notes: z.string().optional(),
});

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function createInspection(prevState: any, formData: FormData) {
    const user = await verifyUser();

    const bookingId = formData.get('bookingId') as string;
    const type = formData.get('type') as string;
    const fuelLevel = parseFloat(formData.get('fuelLevel') as string);
    const mileage = parseFloat(formData.get('mileage') as string);
    const notes = formData.get('notes') as string;
    const damagePointsStr = formData.get('damagePoints') as string;

    // Handle Photos
    const photos: string[] = [];
    const files = formData.getAll('photos') as File[];

    if (files && files.length > 0) {
        try {
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'inspections');
            await mkdir(uploadDir, { recursive: true });

            for (const file of files) {
                if (file.size > 0) {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
                    const filepath = join(uploadDir, filename);
                    await writeFile(filepath, buffer);
                    photos.push(`/uploads/inspections/${filename}`);
                }
            }
        } catch (error) {
            console.error("Inspection photo upload failed:", error);
        }
    }

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { car: true }
    });

    if (!booking) {
        return { success: false, error: 'Booking not found' };
    }

    // Authorization: Admin or Car Owner
    if (user.role !== 'Admin' && booking.car.ownerId !== user.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.inspection.create({
            data: {
                bookingId,
                type,
                fuelLevel,
                mileage,
                photos: JSON.stringify(photos),
                damagePoints: damagePointsStr, // Already JSON string
                notes,
                performedBy: user.name,
            }
        });

        revalidatePath(`/bookings/${bookingId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to create inspection:', error);
        return { success: false, error: 'Failed to save inspection' };
    }
}

export async function getInspections(bookingId: string) {
    const user = await verifyUser();

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { car: true }
    });

    if (!booking) return [];

    if (user.role !== 'Admin' && booking.car.ownerId !== user.id) {
        return [];
    }

    const inspections = await prisma.inspection.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'desc' }
    });

    return inspections.map(i => ({
        ...i,
        photos: JSON.parse(i.photos),
        damagePoints: JSON.parse(i.damagePoints)
    }));
}
