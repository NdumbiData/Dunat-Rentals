'use client';

import '@/app/bookings/bookings.css';
import { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Booking, Car, Invoice } from '@prisma/client';
import NewBookingModal from '@/components/NewBookingModal';
import EditBookingModal from '@/components/EditBookingModal';
import { cancelBooking, completeBooking, deleteBooking, reactivateBooking, approveBooking } from '@/app/actions/bookings';
import Sidebar from './Sidebar';

interface BookingsClientProps {
    initialBookings: (Booking & { invoice: Invoice | null })[];
    cars: Car[];
}

export default function BookingsClient({ initialBookings, cars }: BookingsClientProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<(Booking & { invoice: Invoice | null })[]>([]);
    const [filter, setFilter] = useState('All');
    const [carFilter, setCarFilter] = useState('ALL');

    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user) {
            const myCarIds = user.role === 'Admin'
                ? cars.map(c => c.id)
                : cars.filter(c => c.ownerId === user.id).map(c => c.id);

            // Client-side filtering for safety, though server already filters.
            // For Admin, myCarIds is all cars.
            // For Owner, it might be empty if we rely only on server filtering.
            // Actually, server passes filtered bookings. So we can just use initialBookings.
            // But let's keep this logic if it helps with real-time updates or optimistic UI.
            // However, if server filters, initialBookings is already safe.
            setBookings(initialBookings);
        }
    }, [user, router, initialBookings, cars]);

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = filter === 'All' ? true : b.status === filter;
        const matchesCar = carFilter === 'ALL' ? true : b.carId === carFilter;
        return matchesStatus && matchesCar;
    });

    const getCarName = (carId: string) => {
        const car = cars.find(c => c.id === carId);
        return car ? `${car.make} ${car.model}` : 'Unknown Car';
    };

    const handleCancel = async (id: string) => {
        if (confirm('Are you sure you want to cancel this booking?')) {
            const result = await cancelBooking(id);
            alert(result.message);
        }
    };

    const handleComplete = async (id: string) => {
        if (confirm('Are you sure you want to complete this booking? This will make the car available again.')) {
            const result = await completeBooking(id);
            alert(result.message);
        }
    };

    const handleReactivate = async (id: string) => {
        if (confirm('Are you sure you want to reactivate this booking? This will mark the car as Rented.')) {
            const result = await reactivateBooking(id);
            alert(result.message);
        }
    };

    const handleDelete = async (id: string) => {
        console.log("Delete button clicked for booking:", id);
        if (confirm('Are you sure you want to PERMANENTLY delete this booking? This will also delete associated payments and invoices.')) {
            try {
                const result = await deleteBooking(id);
                console.log("Delete result:", result);
                alert(result.message);
            } catch (error) {
                console.error("Error calling deleteBooking:", error);
                alert("An unexpected error occurred.");
            }
        }
    };

    const handleApprove = async (id: string) => {
        if (confirm('Are you sure you want to approve this booking?')) {
            const result = await approveBooking(id);
            alert(result.message);
        }
    };

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 ml-64 bookings-container">
                {/* Header */}
                <div className="bookings-header">
                    <div>
                        <h2 className="bookings-title">Bookings</h2>
                        <p className="text-gray-600">Manage reservations and customer bookings.</p>
                    </div>
                    {user.role === 'Admin' && (
                        <button
                            className="new-booking-btn"
                            onClick={() => setIsNewBookingModalOpen(true)}
                        >
                            + New Booking
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-4 mb-6 items-center">
                    <div className="flex gap-2">
                        {['All', 'Active', 'Upcoming', 'Pending Approval', 'Completed', 'Cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto">
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            value={carFilter}
                            onChange={(e) => setCarFilter(e.target.value)}
                        >
                            <option value="ALL">All Cars</option>
                            {cars.map(car => (
                                <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bookings-list">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Car</th>
                                <th>Dates</th>
                                <th>Duration</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map(booking => (
                                <tr key={booking.id}>
                                    <td className="font-medium">{booking.customerName}</td>
                                    <td>{getCarName(booking.carId)}</td>
                                    <td className="text-sm">
                                        {new Date(booking.startDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                                        <span className="mx-2 text-gray-400">to</span>
                                        {new Date(booking.endDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td>
                                        {Math.max(1, Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)))} Days
                                        {booking.status === 'Active' && (
                                            <span className="text-xs text-gray-400 block mt-1">
                                                ({Math.max(0, Math.floor((new Date().getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)))} days elapsed)
                                            </span>
                                        )}
                                    </td>
                                    <td className="font-medium">KES {booking.totalAmount.toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${booking.status === 'Active' ? 'status-active' :
                                            booking.status === 'Upcoming' ? 'status-active' : // Reuse active for upcoming or add specific class
                                                booking.status === 'Pending Approval' ? 'status-pending' :
                                                    booking.status === 'Completed' ? 'status-completed' :
                                                        'status-cancelled'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap">
                                            {user.role === 'Admin' && booking.status === 'Pending Approval' && (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleApprove(booking.id)}
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            <button
                                                className="action-btn"
                                                onClick={() => setEditingBooking(booking)}
                                            >
                                                Edit
                                            </button>
                                            <a
                                                href={`/bookings/${booking.id}/inspect`}
                                                className="action-btn no-underline"
                                            >
                                                Inspect
                                            </a>
                                            {booking.status === 'Active' && (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleComplete(booking.id)}
                                                >
                                                    Complete
                                                </button>
                                            )}
                                            {booking.status === 'Completed' && (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleReactivate(booking.id)}
                                                >
                                                    Reactivate
                                                </button>
                                            )}
                                            {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleCancel(booking.id)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {booking.invoice && (
                                                booking.invoice.pdfUrl ? (
                                                    <a
                                                        href={booking.invoice.pdfUrl}
                                                        target="_blank"
                                                        className="action-btn no-underline"
                                                    >
                                                        Invoice
                                                    </a>
                                                ) : (
                                                    <button
                                                        className="action-btn"
                                                        onClick={async () => {
                                                            if (confirm('Generate Invoice PDF?')) {
                                                                const { generateInvoicePDF } = await import('@/app/actions/invoices');
                                                                const result = await generateInvoicePDF(booking.id);
                                                                if (result.success) {
                                                                    alert('Invoice generated!');
                                                                    router.refresh();
                                                                } else {
                                                                    alert(result.message);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        Gen Invoice
                                                    </button>
                                                )
                                            )}
                                            <button
                                                className="action-btn"
                                                onClick={() => handleDelete(booking.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredBookings.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No bookings found.
                        </div>
                    )}
                </div>

                <NewBookingModal isOpen={isNewBookingModalOpen} onClose={() => setIsNewBookingModalOpen(false)} cars={cars} />
                {editingBooking && (
                    <EditBookingModal
                        isOpen={!!editingBooking}
                        onClose={() => setEditingBooking(null)}
                        booking={editingBooking}
                        cars={cars}
                    />
                )}
            </main>
        </div>
    );
}
