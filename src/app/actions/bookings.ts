'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const bookingSchema = z.object({
    customerName: z.string().min(1, "Customer name is required"),
    carId: z.string().min(1, "Car selection is required"),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date",
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date",
    }),
    discountPerDay: z.coerce.number().min(0).optional().default(0),
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
}, {
    message: "End date must be after start date",
    path: ["endDate"],
});

import { verifyUser } from '@/lib/auth-check';

export async function createBooking(prevState: any, formData: FormData) {
    const user = await verifyUser();
    const rawData = {
        customerName: formData.get('customerName'),
        carId: formData.get('carId'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        discountPerDay: formData.get('discountPerDay'),
    };

    const validatedFields = bookingSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { customerName, carId, startDate, endDate, discountPerDay } = validatedFields.data;

    try {
        // 1. Check if car exists and get its daily rate
        const car = await prisma.car.findUnique({
            where: { id: carId },
        });

        if (!car) {
            return { success: false, message: "Selected car not found." };
        }

        // Ownership Check for Owners
        if (user.role === 'Owner' && car.ownerId !== user.id) {
            return { success: false, message: "Unauthorized: You can only book your own cars." };
        }

        // 2. Check for overlapping bookings
        const overlappingBooking = await prisma.booking.findFirst({
            where: {
                carId: carId,
                status: { not: 'Cancelled' },
                OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate },
                    },
                ],
            },
        });

        if (overlappingBooking) {
            return { success: false, message: "Car is already booked for these dates." };
        }

        // 3. Calculate total amount with Dynamic Pricing
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Ensure at least 1 day is charged even for same-day returns
        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Fetch overlapping seasons
        const seasons = await prisma.season.findMany({
            where: {
                OR: [
                    { startDate: { lte: end }, endDate: { gte: start } }
                ]
            }
        });

        let totalAmount = 0;
        let currentDate = new Date(start);

        // Loop through each day to calculate price
        for (let i = 0; i < totalDays; i++) {
            let dailyRate = car.dailyRate;

            // Check if current date falls into any season
            const activeSeason = seasons.find(s =>
                currentDate >= s.startDate && currentDate <= s.endDate
            );

            if (activeSeason) {
                dailyRate *= activeSeason.priceMultiplier;
            }

            // Apply discount
            dailyRate = Math.max(0, dailyRate - discountPerDay);

            totalAmount += dailyRate;

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 4. Determine Initial Status
        const now = new Date();
        let initialStatus = 'Upcoming';

        if (user.role === 'Owner') {
            initialStatus = 'Pending Approval';
        } else if (start <= now && end > now) {
            initialStatus = 'Active';
        }

        // 5. Ensure Client Exists
        await prisma.client.upsert({
            where: { name: customerName },
            update: {},
            create: { name: customerName }
        });

        // 6. Create Booking
        const booking = await prisma.booking.create({
            data: {
                customerName,
                carId,
                startDate,
                endDate,
                totalAmount,
                discountPerDay,
                status: initialStatus,
            },
        });

        // 7. Create Invoice automatically with Dynamic Numbering
        // Use a transaction or sequential operations. For SQLite simple app, sequential is fine but transaction is better for consistency.
        // However, to keep it simple within this function without refactoring everything into a huge transaction block (which Prisma supports but might be complex with existing logic), we will do it step-by-step.
        // Ideally, we should wrap the whole createBooking logic in a transaction.

        // Fetch current settings to get the counter
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            // Create default settings if not exists
            settings = await prisma.systemSettings.create({
                data: {
                    companyName: "Dunat Car Rental",
                    lastInvoiceCounter: 90
                }
            });
        }

        const newCounter = settings.lastInvoiceCounter + 10;
        const currentYear = new Date().getFullYear();
        const invoiceNumber = `DTCH/I/${newCounter}/${currentYear}`;

        // Update settings
        await prisma.systemSettings.update({
            where: { id: settings.id },
            data: { lastInvoiceCounter: newCounter }
        });

        await prisma.invoice.create({
            data: {
                bookingId: booking.id,
                invoiceNumber: invoiceNumber,
                total: totalAmount,
                status: 'Pending',
                items: JSON.stringify([
                    { description: `Car Rental: ${car.make} ${car.model} (${totalDays} days)`, amount: totalAmount + (discountPerDay * totalDays) }, // Base amount before discount
                    ...(discountPerDay > 0 ? [{ description: `Discount (KES ${discountPerDay}/day)`, amount: -(discountPerDay * totalDays) }] : [])
                ]),
                date: startDate,
            }
        });

        // 8. Create Pending Payment Record
        await prisma.payment.create({
            data: {
                bookingId: booking.id,
                amount: totalAmount,
                dueDate: endDate.split('T')[0], // Use end date as due date
                status: 'Pending',
                // method is optional, omitting it to avoid issues with stale client
            }
        });

        // 9. Update Car Status if booking is Active
        if (initialStatus === 'Active') {
            await prisma.car.update({
                where: { id: carId },
                data: { status: 'Rented' },
            });
        }

        revalidatePath('/bookings');
        revalidatePath('/fleet');
        revalidatePath('/payments');
        revalidatePath('/reports'); // Ensure reports are updated

        return { success: true, message: user.role === 'Owner' ? "Booking request submitted for approval!" : "Booking created successfully!" };
    } catch (error: any) {
        console.error("Failed to create booking:", error);
        return { success: false, message: `Failed to create booking: ${error.message || "Unknown error"}` };
    }
}

export async function approveBooking(id: string) {
    const user = await verifyUser();
    if (user.role !== 'Admin') {
        return { success: false, message: "Unauthorized: Only Admins can approve bookings." };
    }

    try {
        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking) return { success: false, message: "Booking not found." };

        if (booking.status !== 'Pending Approval') {
            return { success: false, message: "Booking is not pending approval." };
        }

        // Determine new status based on dates
        const now = new Date();
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        let newStatus = 'Upcoming';
        if (start <= now && end > now) {
            newStatus = 'Active';
        }

        await prisma.booking.update({
            where: { id },
            data: { status: newStatus }
        });

        if (newStatus === 'Active') {
            await prisma.car.update({
                where: { id: booking.carId },
                data: { status: 'Rented' }
            });
        }

        revalidatePath('/bookings');
        revalidatePath('/fleet');
        return { success: true, message: "Booking approved successfully!" };
    } catch (error) {
        console.error("Failed to approve booking:", error);
        return { success: false, message: "Failed to approve booking." };
    }
}

export async function updateBooking(prevState: any, formData: FormData) {
    const user = await verifyUser();
    const id = formData.get('id') as string;
    const rawData = {
        customerName: formData.get('customerName'),
        carId: formData.get('carId'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        discountPerDay: formData.get('discountPerDay'),
    };

    const validatedFields = bookingSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { customerName, carId, startDate, endDate, discountPerDay } = validatedFields.data;

    try {
        // 1. Check if new car exists
        const car = await prisma.car.findUnique({ where: { id: carId } });
        if (!car) return { success: false, message: "Selected car not found." };

        // Ownership Check for Owners (New Car)
        if (user.role === 'Owner' && car.ownerId !== user.id) {
            return { success: false, message: "Unauthorized: You can only book your own cars." };
        }

        // 2. Check if existing booking belongs to Owner
        if (user.role === 'Owner') {
            const existingBooking = await prisma.booking.findUnique({
                where: { id },
                include: { car: true }
            });
            if (!existingBooking || existingBooking.car.ownerId !== user.id) {
                return { success: false, message: "Unauthorized: You can only edit bookings for your own cars." };
            }
        }

        // Recalculate total
        // Recalculate total with Dynamic Pricing
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Fetch overlapping seasons
        const seasons = await prisma.season.findMany({
            where: {
                OR: [
                    { startDate: { lte: end }, endDate: { gte: start } }
                ]
            }
        });

        let totalAmount = 0;
        let currentDate = new Date(start);

        // Loop through each day
        for (let i = 0; i < totalDays; i++) {
            let dailyRate = car.dailyRate;

            // Check season
            const activeSeason = seasons.find(s =>
                currentDate >= s.startDate && currentDate <= s.endDate
            );

            if (activeSeason) {
                dailyRate *= activeSeason.priceMultiplier;
            }

            // Apply discount
            dailyRate = Math.max(0, dailyRate - discountPerDay);

            totalAmount += dailyRate;

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Ensure Client Exists (same as create)
        await prisma.client.upsert({
            where: { name: customerName },
            update: {},
            create: { name: customerName }
        });

        await prisma.booking.update({
            where: { id },
            data: {
                customerName, // Explicitly set foreign key
                carId,
                startDate,
                endDate,
                totalAmount,
                discountPerDay,
            },
        });

        // Update Invoice as well
        await prisma.invoice.update({
            where: { bookingId: id },
            data: {
                total: totalAmount,
                items: JSON.stringify([
                    { description: `Car Rental: ${car.make} ${car.model} (${totalDays} days)`, amount: totalAmount + (discountPerDay * totalDays) },
                    ...(discountPerDay > 0 ? [{ description: `Discount (KES ${discountPerDay}/day)`, amount: -(discountPerDay * totalDays) }] : [])
                ]),
                date: startDate,
            }
        });

        // Update Pending Payment logic to ensure Total Payments match Invoice Total
        const payments = await prisma.payment.findMany({
            where: { bookingId: id }
        });

        const totalPaid = payments
            .filter((p: any) => p.status === 'Paid')
            .reduce((sum: number, p: any) => sum + p.amount, 0);

        const balance = totalAmount - totalPaid;

        // Find existing pending payment
        const pendingPayment = payments.find((p: any) => p.status === 'Pending');

        if (balance > 0) {
            if (pendingPayment) {
                // Update existing pending payment to match the new balance
                await prisma.payment.update({
                    where: { id: pendingPayment.id },
                    data: {
                        amount: balance,
                        dueDate: endDate.split('T')[0]
                    }
                });
            } else {
                // Create new pending payment for the balance
                await prisma.payment.create({
                    data: {
                        bookingId: id,
                        amount: balance,
                        dueDate: endDate.split('T')[0],
                        status: 'Pending',
                        method: null
                    }
                });
            }
        } else {
            // If balance is 0 or negative (overpaid/refund needed), remove any pending payments
            if (pendingPayment) {
                await prisma.payment.delete({
                    where: { id: pendingPayment.id }
                });
            }
        }

        revalidatePath('/bookings');
        revalidatePath('/payments');
        revalidatePath('/reports');
        return { success: true, message: "Booking updated successfully!" };
    } catch (error: any) {
        console.error("Failed to update booking:", error);
        return { success: false, message: `Failed to update booking: ${error.message || "Unknown error"}` };
    }
}

export async function cancelBooking(id: string) {
    await verifyUser();
    try {
        // Get booking details before update to check status
        const bookingToCancel = await prisma.booking.findUnique({
            where: { id },
            include: { car: true }
        });

        if (!bookingToCancel) {
            return { success: false, message: "Booking not found." };
        }

        await prisma.booking.update({
            where: { id },
            data: { status: 'Cancelled' },
        });

        // If the booking was Active, free up the car
        if (bookingToCancel.status === 'Active') {
            await prisma.car.update({
                where: { id: bookingToCancel.carId },
                data: { status: 'Available' }
            });
        }

        // Update invoice status
        await prisma.invoice.update({
            where: { bookingId: id },
            data: { status: 'Void' }
        });

        // Delete pending payments
        await prisma.payment.deleteMany({
            where: {
                bookingId: id,
                status: 'Pending'
            }
        });

        revalidatePath('/bookings');
        revalidatePath('/fleet');
        revalidatePath('/payments');
        revalidatePath('/reports');
        return { success: true, message: "Booking cancelled successfully!" };
    } catch (error) {
        console.error("Failed to cancel booking:", error);
        return { success: false, message: "Failed to cancel booking." };
    }
}

export async function completeBooking(id: string) {
    await verifyUser();
    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!booking) {
            return { success: false, message: "Booking not found." };
        }

        if (booking.status !== 'Active') {
            return { success: false, message: "Only active bookings can be completed." };
        }

        // Update booking status
        await prisma.booking.update({
            where: { id },
            data: { status: 'Completed' },
        });

        // Free up the car
        await prisma.car.update({
            where: { id: booking.carId },
            data: { status: 'Available' }
        });

        revalidatePath('/bookings');
        revalidatePath('/fleet');
        return { success: true, message: "Booking completed successfully!" };
    } catch (error) {
        console.error("Failed to complete booking:", error);
        return { success: false, message: "Failed to complete booking." };
    }
}

export async function reactivateBooking(id: string) {
    await verifyUser();
    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!booking) {
            return { success: false, message: "Booking not found." };
        }

        if (booking.status !== 'Completed') {
            return { success: false, message: "Only completed bookings can be reactivated." };
        }

        // Check for overlapping active bookings for the same car
        const overlappingBooking = await prisma.booking.findFirst({
            where: {
                carId: booking.carId,
                status: 'Active',
                id: { not: id }, // Exclude current booking
                OR: [
                    {
                        startDate: { lte: booking.endDate },
                        endDate: { gte: booking.startDate },
                    },
                ],
            },
        });

        if (overlappingBooking) {
            return { success: false, message: "Cannot reactivate: Car is currently active in another booking for these dates." };
        }

        // Update booking status
        await prisma.booking.update({
            where: { id },
            data: { status: 'Active' },
        });

        // Update car status to Rented
        await prisma.car.update({
            where: { id: booking.carId },
            data: { status: 'Rented' }
        });

        revalidatePath('/bookings');
        revalidatePath('/fleet');
        return { success: true, message: "Booking reactivated successfully!" };
    } catch (error) {
        console.error("Failed to reactivate booking:", error);
        return { success: false, message: "Failed to reactivate booking." };
    }
}

export async function deleteBooking(id: string) {
    await verifyUser();
    try {
        // 1. Check if booking exists
        const booking = await prisma.booking.findUnique({
            where: { id }
        });

        if (!booking) {
            return { success: false, message: "Booking not found." };
        }

        // 2. Perform Delete (Cascade will handle related records)
        await prisma.$transaction(async (tx) => {
            // Delete Booking
            await tx.booking.delete({
                where: { id }
            });

            // If the booking was Active or Upcoming, free up the car
            if (booking.status === 'Active' || booking.status === 'Upcoming') {
                await tx.car.update({
                    where: { id: booking.carId },
                    data: { status: 'Available' }
                });
            }
        });

        revalidatePath('/bookings');
        revalidatePath('/fleet');
        revalidatePath('/payments');
        revalidatePath('/reports');
        return { success: true, message: "Booking deleted successfully!" };
    } catch (error: any) {
        console.error("Failed to delete booking:", error);
        return { success: false, message: `Failed to delete booking: ${error.message || "Unknown error"}` };
    }
}
