import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/lib/auth-check';
import { redirect } from 'next/navigation';
import InspectionForm from '@/components/InspectionForm';
import Sidebar from '@/components/Sidebar';

export default async function InspectionPage({ params }: { params: { id: string } }) {
    const user = await verifyUser();
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { car: true }
    });

    if (!booking) {
        redirect('/bookings');
    }

    // Authorization
    if (user.role !== 'Admin' && booking.car.ownerId !== user.id) {
        redirect('/bookings');
    }

    return (
        <main style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '280px', padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Perform Inspection</h1>
                    <p style={{ color: '#94a3b8' }}>
                        Booking #{booking.id.slice(-6)} • {booking.car.make} {booking.car.model} ({booking.car.plate})
                    </p>
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <InspectionForm bookingId={booking.id} carName={`${booking.car.make} ${booking.car.model}`} />
                </div>
            </div>
        </main>
    );
}
