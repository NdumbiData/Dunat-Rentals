
import Dashboard from '@/components/Dashboard';
import { prisma } from '@/lib/prisma';
import { checkBookingStatuses } from '@/lib/cron';
import { verifyUser } from '@/lib/auth-check';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Run automation check on dashboard load
  await checkBookingStatuses();

  let user;
  try {
    user = await verifyUser();
  } catch (error) {
    redirect('/login');
  }

  // Fetch data with Soft Delete filtering and Ownership checks
  const [cars, bookings, payments] = await Promise.all([
    prisma.car.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted cars
        ...(user.role === 'Owner' ? { ownerId: user.id } : {})
      },
      include: { bookings: true }
    }),
    prisma.booking.findMany({
      where: {
        ...(user.role === 'Owner' ? { car: { ownerId: user.id } } : {})
      },
      include: { car: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.payment.findMany({
      where: {
        ...(user.role === 'Owner' ? { booking: { car: { ownerId: user.id } } } : {})
      },
      include: { booking: { include: { car: true } } },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <Dashboard cars={cars} bookings={bookings} payments={payments} />
  );
}
