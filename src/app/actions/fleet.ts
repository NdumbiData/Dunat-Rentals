'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const carSchema = z.object({
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
    plate: z.string().min(1, "License plate is required"),
    category: z.enum(['Sedan', 'Mid-SUV', 'Full SUV', 'Commercial']),
    dailyRate: z.coerce.number().positive("Daily rate must be positive"),
    status: z.enum(['Available', 'Rented', 'Maintenance']),
    image: z.string().optional(), // We'll use a placeholder if not provided
    ownerId: z.string().optional(),
});

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// ... (imports)

import { verifyUser } from '@/lib/auth-check';

export async function addCar(prevState: any, formData: FormData) {
    await verifyUser();
    const imageFile = formData.get('image') as File | null;
    let imagePath = '/placeholder-car.png';

    if (imageFile && imageFile.size > 0) {
        try {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadDir = join(process.cwd(), 'public', 'uploads');

            // Ensure directory exists
            await mkdir(uploadDir, { recursive: true });

            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const filename = `${uniqueSuffix}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const filepath = join(uploadDir, filename);

            await writeFile(filepath, buffer);
            imagePath = `/uploads/${filename}`;
        } catch (error) {
            console.error("Image upload failed:", error);
            // Continue without image or return error? Let's continue with placeholder but log it.
        }
    }

    const rawData = {
        make: formData.get('make'),
        model: formData.get('model'),
        year: formData.get('year'),
        plate: formData.get('plate'),
        category: formData.get('category'),
        dailyRate: formData.get('dailyRate'),
        status: formData.get('status'),
        image: imagePath,
        ownerId: formData.get('ownerId') || undefined,
    };

    const validatedFields = carSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.car.create({
            data: {
                ...validatedFields.data,
                image: validatedFields.data.image || '/placeholder-car.png'
            },
        });

        revalidatePath('/fleet');
        return { success: true, message: "Car added successfully!" };
    } catch (error: any) {
        // Check for unique constraint violation on plate
        if (error.code === 'P2002') {
            return { success: false, message: "A car with this license plate already exists." };
        }
        console.error("Failed to add car:", error);
        return { success: false, message: "Failed to add car. Please try again." };
    }
}

export async function editCar(prevState: any, formData: FormData) {
    await verifyUser();
    const id = formData.get('id') as string;

    // Handle Image Upload
    const imageFile = formData.get('image') as File | null;
    let imagePath = undefined;

    if (imageFile && imageFile.size > 0) {
        try {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadDir = join(process.cwd(), 'public', 'uploads');
            await mkdir(uploadDir, { recursive: true });

            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const filename = `${uniqueSuffix}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const filepath = join(uploadDir, filename);

            await writeFile(filepath, buffer);
            imagePath = `/uploads/${filename}`;
        } catch (error) {
            console.error("Image upload failed:", error);
        }
    }

    const rawData = {
        make: formData.get('make'),
        model: formData.get('model'),
        year: formData.get('year'),
        plate: formData.get('plate'),
        category: formData.get('category'),
        dailyRate: formData.get('dailyRate'),
        status: formData.get('status'),
        ...(imagePath ? { image: imagePath } : {}),
        ownerId: formData.get('ownerId') || undefined,
    };

    const validatedFields = carSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.car.update({
            where: { id },
            data: validatedFields.data,
        });

        revalidatePath('/fleet');
        return { success: true, message: "Car updated successfully!" };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: "A car with this license plate already exists." };
        }
        console.error("Failed to update car:", error);
        return { success: false, message: "Failed to update car. Please try again." };
    }
}

export async function deleteCar(id: string) {
    await verifyUser();
    try {
        // 1. Check for active/upcoming bookings
        const activeBookings = await prisma.booking.findFirst({
            where: {
                carId: id,
                status: { in: ['Active', 'Upcoming', 'Pending Approval'] }
            }
        });

        if (activeBookings) {
            return { success: false, message: "Cannot delete car with active or upcoming bookings." };
        }

        // 2. Soft Delete Car (Set deletedAt)
        await prisma.car.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        revalidatePath('/fleet');
        return { success: true, message: "Car deleted successfully!" };
    } catch (error) {
        console.error("Failed to delete car:", error);
        return { success: false, message: "Failed to delete car. Please try again." };
    }
}
