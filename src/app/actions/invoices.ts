'use server';

import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/lib/auth-check';
import { revalidatePath } from 'next/cache';
import { renderToStream } from '@react-pdf/renderer';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import React from 'react';

export async function generateInvoicePDF(bookingId: string) {
    const user = await verifyUser();

    // 1. Fetch Data
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            car: true,
            invoice: true
        }
    });

    if (!booking || !booking.invoice) {
        return { success: false, message: "Booking or Invoice not found." };
    }

    // Authorization: Admin or Owner of the car
    if (user.role !== 'Admin' && booking.car.ownerId !== user.id) {
        // Also allow if the user is the customer? (Future feature)
        return { success: false, message: "Unauthorized." };
    }

    // Fetch System Settings
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
        // Create default settings if missing
        settings = await prisma.systemSettings.create({
            data: {
                companyName: 'Dunat Car Rental',
                currency: 'KES',
                vatRate: 16.0
            }
        });
    }

    // Ensure settings is not null (TypeScript check)
    if (!settings) {
        throw new Error("Failed to load system settings");
    }

    try {
        // 2. Prepare File Path
        const invoicesDir = join(process.cwd(), 'public', 'invoices');
        await mkdir(invoicesDir, { recursive: true });

        const filename = `invoice-${booking.invoice.id}.pdf`;
        const filepath = join(invoicesDir, filename);
        const publicUrl = `/invoices/${filename}`;

        // 3. Render PDF
        // We need to pass the component as a React element
        const element = React.createElement(InvoiceTemplate, {
            invoice: booking.invoice,
            booking: booking,
            car: booking.car,
            settings: settings
        });
        const stream = await renderToStream(element as any);

        // 4. Save to File
        const writeStream = createWriteStream(filepath);
        stream.pipe(writeStream);

        await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });

        // 5. Update Invoice Record
        await prisma.invoice.update({
            where: { id: booking.invoice.id },
            data: { pdfUrl: publicUrl }
        });

        revalidatePath('/bookings');
        return { success: true, pdfUrl: publicUrl };

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        return { success: false, message: "Failed to generate PDF." };
    }
}
