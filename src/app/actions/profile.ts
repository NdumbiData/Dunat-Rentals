'use server';

import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/lib/auth-check';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export async function updateProfile(prevState: any, formData: FormData) {
    const user = await verifyUser();

    const rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
    };

    const validatedFields = profileSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { success: false, message: "Validation failed", errors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: validatedFields.data,
        });
        revalidatePath('/settings');
        return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
        return { success: false, message: "Failed to update profile." };
    }
}

export async function changePassword(prevState: any, formData: FormData) {
    const user = await verifyUser();

    const rawData = {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword'),
    };

    const validatedFields = passwordSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { success: false, message: "Validation failed", errors: validatedFields.error.flatten().fieldErrors };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    // Verify current password
    // Note: In a real app, we'd fetch the password hash. verifyUser doesn't return password by default usually, 
    // but let's assume we fetch it or need to fetch it here.
    const userWithPassword = await prisma.user.findUnique({ where: { id: user.id } });

    if (!userWithPassword || !userWithPassword.password) {
        return { success: false, message: "User not found or password not set." };
    }

    const isValid = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isValid) {
        return { success: false, message: "Incorrect current password." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
    });

    return { success: true, message: "Password changed successfully!" };
}
