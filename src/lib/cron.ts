import { prisma } from '@/lib/prisma';

export async function checkBookingStatuses() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
        // 1. Find 'Active' bookings that have ended (EndDate < Today)
        // These should be marked 'Completed' (or we might want manual completion, but user asked for automation)
        // User request: "The tags available, rented should be automatic following dates per day"

        // Actually, let's look at it this way:
        // If today is within startDate and endDate -> Status should be 'Rented'
        // If today > endDate -> Status should be 'Available' (if not already booked again)

        // Let's find cars that are currently marked 'Rented' but their booking has ended
        const rentedCars = await prisma.car.findMany({
            where: { status: 'Rented' },
            include: { bookings: { where: { status: 'Active' } } }
        });

        for (const car of rentedCars) {
            // Find the active booking
            const activeBooking = car.bookings[0];
            if (activeBooking) {
                if (activeBooking.endDate < today) {
                    // Booking ended yesterday or earlier
                    // Mark booking as Completed
                    await prisma.booking.update({
                        where: { id: activeBooking.id },
                        data: { status: 'Completed' }
                    });
                    // Mark car as Available
                    await prisma.car.update({
                        where: { id: car.id },
                        data: { status: 'Available' }
                    });
                    console.log(`Auto-completed booking ${activeBooking.id} and freed car ${car.id}`);
                }
            } else {
                // Car is marked Rented but has no Active booking? Fix it.
                await prisma.car.update({
                    where: { id: car.id },
                    data: { status: 'Available' }
                });
                console.log(`Fixed status for car ${car.id} (was Rented with no active booking)`);
            }
        }

        // 2. Find 'Upcoming' bookings that start today
        const upcomingBookings = await prisma.booking.findMany({
            where: {
                status: 'Upcoming',
                startDate: { lte: today }
            },
            include: { car: true }
        });

        for (const booking of upcomingBookings) {
            // Activate booking
            await prisma.booking.update({
                where: { id: booking.id },
                data: { status: 'Active' }
            });
            // Mark car as Rented
            await prisma.car.update({
                where: { id: booking.carId },
                data: { status: 'Rented' }
            });
            console.log(`Auto-started booking ${booking.id} and rented car ${booking.carId}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Automation Error:", error);
        return { success: false, error };
    }
}
