'use server';

import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/lib/auth-check';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function createDocument(formData: FormData) {
    const user = await verifyUser();

    const carId = formData.get('carId') as string;
    const type = formData.get('type') as string;
    const expiryDateStr = formData.get('expiryDate') as string;
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string;

    if (!carId || !type || !file) {
        return { success: false, message: "Missing required fields." };
    }

    // Authorization: Admin or Owner of the car
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) return { success: false, message: "Car not found." };

    if (user.role !== 'Admin' && car.ownerId !== user.id) {
        return { success: false, message: "Unauthorized." };
    }

    try {
        // Save File
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents');
        await mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const fileUrl = `/uploads/documents/${filename}`;

        // Create Record
        await prisma.assetDocument.create({
            data: {
                carId,
                type,
                expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
                fileUrl,
                notes
            }
        });

        revalidatePath('/fleet');
        return { success: true, message: "Document added successfully!" };
    } catch (error) {
        console.error("Failed to add document:", error);
        return { success: false, message: "Failed to add document." };
    }
}

export async function getDocuments(carId: string) {
    const user = await verifyUser();

    // Authorization check
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) return [];

    if (user.role !== 'Admin' && car.ownerId !== user.id) {
        return [];
    }

    return await prisma.assetDocument.findMany({
        where: { carId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function deleteDocument(documentId: string) {
    const user = await verifyUser();

    const doc = await prisma.assetDocument.findUnique({
        where: { id: documentId },
        include: { car: true }
    });

    if (!doc) return { success: false, message: "Document not found." };

    if (user.role !== 'Admin' && doc.car.ownerId !== user.id) {
        return { success: false, message: "Unauthorized." };
    }

    try {
        await prisma.assetDocument.delete({ where: { id: documentId } });
        revalidatePath('/fleet');
        return { success: true, message: "Document deleted." };
    } catch (error) {
        return { success: false, message: "Failed to delete document." };
    }
}

export async function getExpiringDocuments() {
    const user = await verifyUser();

    // Admin sees all, Owner sees theirs
    const whereCondition = user.role === 'Admin'
        ? {}
        : { car: { ownerId: user.id } };

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const documents = await prisma.assetDocument.findMany({
        where: {
            ...whereCondition,
            expiryDate: {
                lte: thirtyDaysFromNow,
                gte: new Date() // Not expired yet, but soon
            }
        },
        include: { car: true },
        orderBy: { expiryDate: 'asc' }
    });

    const expiredDocuments = await prisma.assetDocument.findMany({
        where: {
            ...whereCondition,
            expiryDate: {
                lt: new Date()
            }
        },
        include: { car: true },
        orderBy: { expiryDate: 'asc' }
    });

    return { expiring: documents, expired: expiredDocuments };
}
