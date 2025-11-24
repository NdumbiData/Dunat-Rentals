'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const expenseSchema = z.object({
    carId: z.string().min(1, "Car is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    type: z.enum(['Fuel', 'Service', 'Insurance', 'Car Wash', 'Other']),
    amount: z.coerce.number().positive("Amount must be positive"),
    description: z.string().min(1, "Description is required"),
});

import { verifyUser } from '@/lib/auth-check';

export async function addExpense(prevState: any, formData: FormData) {
    const user = await verifyUser();
    const rawData = {
        carId: formData.get('carId'),
        date: formData.get('date'),
        type: formData.get('type'),
        amount: formData.get('amount'),
        description: formData.get('description'),
    };

    const validatedFields = expenseSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    // Ownership check
    if (user.role === 'Owner') {
        const car = await prisma.car.findUnique({ where: { id: validatedFields.data.carId } });
        if (!car || car.ownerId !== user.id) {
            return { success: false, message: "Unauthorized: You can only add expenses for your own cars." };
        }
    }

    try {
        await prisma.expense.create({
            data: validatedFields.data,
        });

        revalidatePath('/expenses');
        revalidatePath('/reports');
        return { success: true, message: "Expense added successfully!" };
    } catch (error) {
        console.error("Failed to add expense:", error);
        return { success: false, message: "Failed to add expense. Please try again." };
    }
}

export async function deleteExpense(id: string) {
    const user = await verifyUser();

    // Ownership check
    if (user.role === 'Owner') {
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: { car: true }
        });
        if (!expense || expense.car.ownerId !== user.id) {
            return { success: false, message: "Unauthorized: You can only delete expenses for your own cars." };
        }
    }

    try {
        await prisma.expense.delete({
            where: { id },
        });

        revalidatePath('/expenses');
        revalidatePath('/reports');
        return { success: true, message: "Expense deleted successfully!" };
    } catch (error) {
        console.error("Failed to delete expense:", error);
        return { success: false, message: "Failed to delete expense. Please try again." };
    }
}

const serviceRecordSchema = z.object({
    carId: z.string().min(1, "Car is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    type: z.enum(['Oil', 'Gearbox', 'Bodyshop', 'Tyres', 'Other']),
    description: z.string().min(1, "Description is required"),
    garageName: z.string().min(1, "Garage name is required"),
    cost: z.coerce.number().positive("Cost must be positive"),
    partsReplaced: z.string().optional(), // Comma separated
});

export async function addServiceRecord(prevState: any, formData: FormData) {
    const user = await verifyUser();
    const rawData = {
        carId: formData.get('carId'),
        date: formData.get('date'),
        type: formData.get('type'),
        description: formData.get('description'),
        garageName: formData.get('garageName'),
        cost: formData.get('cost'),
        partsReplaced: formData.get('partsReplaced') || undefined, // Handle null from missing input
    };

    const validatedFields = serviceRecordSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    // Ownership check
    if (user.role === 'Owner') {
        const car = await prisma.car.findUnique({ where: { id: validatedFields.data.carId } });
        if (!car || car.ownerId !== user.id) {
            return { success: false, message: "Unauthorized: You can only add service records for your own cars." };
        }
    }

    try {
        await prisma.serviceRecord.create({
            data: {
                ...validatedFields.data,
                partsReplaced: validatedFields.data.partsReplaced
                    ? JSON.stringify(validatedFields.data.partsReplaced.split(',').map(p => p.trim()))
                    : '[]',
            },
        });

        revalidatePath('/maintenance');
        revalidatePath('/fleet');
        return { success: true, message: "Service record added successfully!" };
    } catch (error) {
        console.error("Failed to add service record:", error);
        return { success: false, message: "Failed to add service record. Please try again." };
    }
}

export async function deleteServiceRecord(id: string) {
    const user = await verifyUser();

    // Ownership check
    if (user.role === 'Owner') {
        const record = await prisma.serviceRecord.findUnique({
            where: { id },
            include: { car: true }
        });
        if (!record || record.car.ownerId !== user.id) {
            return { success: false, message: "Unauthorized: You can only delete service records for your own cars." };
        }
    }

    try {
        await prisma.serviceRecord.delete({
            where: { id },
        });

        revalidatePath('/maintenance');
        revalidatePath('/fleet');
        return { success: true, message: "Service record deleted successfully!" };
    } catch (error) {
        console.error("Failed to delete service record:", error);
        return { success: false, message: "Failed to delete service record. Please try again." };
    }
}
