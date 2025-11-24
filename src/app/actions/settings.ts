'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { verifySuperAdmin } from '@/lib/auth-check';
import { z } from 'zod';

const settingsSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    companyEmail: z.string().email().optional().or(z.literal('')),
    companyPhone: z.string().optional(),
    companyAddress: z.string().optional(),
    currency: z.string().min(1, "Currency is required"),
    vatRate: z.coerce.number().min(0),
    mpesaPaybill: z.string().optional(),
    bankDetails: z.string().optional(),
    termsAndConditions: z.string().optional(),
});

export async function getSystemSettings() {
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            // Return defaults if no settings found
            return {
                companyName: 'Dunat Car Rental',
                currency: 'KES',
                vatRate: 16.0,
            };
        }
        return settings;
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return null;
    }
}

export async function updateSystemSettings(prevState: any, formData: FormData) {
    await verifySuperAdmin();

    const rawData = {
        companyName: formData.get('companyName'),
        companyEmail: formData.get('companyEmail'),
        companyPhone: formData.get('companyPhone'),
        companyAddress: formData.get('companyAddress'),
        currency: formData.get('currency'),
        vatRate: formData.get('vatRate'),
        mpesaPaybill: formData.get('mpesaPaybill'),
        bankDetails: formData.get('bankDetails'),
        termsAndConditions: formData.get('termsAndConditions'),
    };

    const validatedFields = settingsSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const firstSettings = await prisma.systemSettings.findFirst();

        if (firstSettings) {
            await prisma.systemSettings.update({
                where: { id: firstSettings.id },
                data: validatedFields.data,
            });
        } else {
            await prisma.systemSettings.create({
                data: validatedFields.data,
            });
        }

        revalidatePath('/settings');
        return { success: true, message: "Settings updated successfully!" };
    } catch (error: any) {
        console.error("Failed to update settings:", error);
        return { success: false, message: `Failed to update settings: ${error.message}` };
    }
}
