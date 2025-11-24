'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Payment, Booking, Car, Invoice } from '@prisma/client';
import { markPaymentAsPaid, markPaymentAsUnpaid, recordPayment } from '@/app/actions/payments';

type TimeFilter = 'All' | 'Daily' | 'Monthly' | 'Yearly';

interface PaymentsClientProps {
    initialPayments: Payment[];
    bookings: (Booking & { invoice: Invoice | null })[];
    cars: Car[];
}

export default function PaymentsClient({ initialPayments, bookings, cars }: PaymentsClientProps) {

    const { user } = useAuth();
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');

    const searchParams = useSearchParams();
    const initialStatusFilter = searchParams.get('status');
    const [statusFilter, setStatusFilter] = useState<string | null>(initialStatusFilter);
    const [bookingIdFilter, setBookingIdFilter] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user) {
            const myCarIds = user.role === 'Admin'
                ? cars.map(c => c.id)
                : cars.filter(c => c.ownerId === user.id).map(c => c.id);

            const myPayments = initialPayments.filter(p => {
                const booking = bookings.find(b => b.id === p.bookingId);
                return booking && myCarIds.includes(booking.carId);
            });

            setPayments(myPayments);
        }
    }, [user, router, initialPayments, bookings, cars]);

    // Update filter if URL changes
    useEffect(() => {
        setStatusFilter(searchParams.get('status'));
    }, [searchParams]);

    const filteredPayments = payments.filter(payment => {
        // Booking ID Filter
        if (bookingIdFilter && payment.bookingId !== bookingIdFilter) return false;

        // Status Filter
        if (statusFilter && payment.status !== statusFilter) return false;

        // Time Filter
        if (timeFilter === 'All') return true;
        const date = new Date(payment.dueDate);
        const now = new Date();

        if (timeFilter === 'Daily') {
            return date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();
        }
        if (timeFilter === 'Monthly') {
            return date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();
        }
        if (timeFilter === 'Yearly') {
            return date.getFullYear() === now.getFullYear();
        }
        return true;
    });

    const getBookingDetails = (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        return booking;
    };

    const totalRevenue = filteredPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = filteredPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    const overdueAmount = filteredPayments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);

    // Calculate Overpayment
    // Overpayment is defined as the sum of (Total Paid - Expected Payment) for all bookings where Total Paid > Expected Payment
    const overpaidAmount = bookings.reduce((sum, booking) => {
        if (booking.status !== 'Active') return sum;
        const bookingPayments = payments.filter(p => p.bookingId === booking.id && p.status === 'Paid');
        const totalPaid = bookingPayments.reduce((s, p) => s + p.amount, 0);

        const car = cars.find(c => c.id === booking.carId);
        const startDate = new Date(booking.startDate);
        const now = new Date();
        const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyRate = car ? car.dailyRate : 0;
        const expectedPayment = daysElapsed * dailyRate;

        if (totalPaid > expectedPayment) {
            return sum + (totalPaid - expectedPayment);
        }
        return sum;
    }, 0);

    const handleRecordPayment = async (bookingId: string, amount: number, method: string) => {
        if (confirm(`Are you sure you want to record a payment of ${amount} via ${method}?`)) {
            const result = await recordPayment(bookingId, amount, method);
            alert(result.message);
        }
    };

    const handleMarkPaid = async (id: string, method: string, amount?: number) => {
        if (confirm(`Are you sure you want to mark this payment as paid via ${method}?${amount ? ` Amount: ${amount}` : ''}`)) {
            const result = await markPaymentAsPaid(id, method, amount);
            alert(result.message);
        }
    };

    if (!user) return null;

    return (
        <div style={{ padding: '0' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Revenue & Payments</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Track income and manage payment reminders.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    {(['All', 'Daily', 'Monthly', 'Yearly'] as TimeFilter[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius)',
                                border: 'none',
                                backgroundColor: timeFilter === filter ? 'var(--primary)' : 'transparent',
                                color: timeFilter === filter ? 'var(--primary-fg)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid-dashboard" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--success)', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Collected ({timeFilter})</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>KES {totalRevenue.toLocaleString()}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--info)', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>KES {pendingAmount.toLocaleString()}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--destructive)', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Overdue</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>KES {overdueAmount.toLocaleString()}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Overpaid</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>KES {overpaidAmount.toLocaleString()}</div>
                </div>
            </div>

            {/* Active Rentals Payment Status */}
            <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', padding: '1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-main)' }}>Active Rentals Status</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Customer</th>
                            <th style={{ padding: '1rem' }}>Car</th>
                            <th style={{ padding: '1rem' }}>Duration (Total)</th>
                            <th style={{ padding: '1rem' }}>Daily Rate</th>
                            <th style={{ padding: '1rem' }}>Total Amount</th>
                            <th style={{ padding: '1rem' }}>Total Paid</th>
                            <th style={{ padding: '1rem' }}>Total Balance</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Invoice</th>
                            <th style={{ padding: '1rem' }}>Amount</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.filter(b => b.status === 'Active').map(booking => {
                            const car = cars.find(c => c.id === booking.carId);
                            const bookingPayments = payments.filter(p => p.bookingId === booking.id && p.status === 'Paid');
                            const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);

                            const startDate = new Date(booking.startDate);
                            const endDate = new Date(booking.endDate);
                            const now = new Date();

                            // Total Duration (Booking)
                            const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

                            // Elapsed Duration (For Overdue Logic)
                            const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

                            const dailyRate = car ? car.dailyRate : 0;
                            const totalAmount = booking.totalAmount; // Use booking total directly
                            const expectedSoFar = daysElapsed * dailyRate;

                            const isOverdue = totalPaid < expectedSoFar;
                            const overdueAmount = expectedSoFar - totalPaid;
                            const overdueDays = dailyRate > 0 ? Math.ceil(overdueAmount / dailyRate) : 0;
                            const totalBalance = Math.max(0, totalAmount - totalPaid);

                            return (
                                <tr key={booking.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{booking.customerName}</td>
                                    <td style={{ padding: '1rem' }}>{car ? `${car.make} ${car.model}` : 'Unknown'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {totalDays} Days
                                    </td>
                                    <td style={{ padding: '1rem' }}>KES {dailyRate.toLocaleString()}</td>
                                    <td style={{ padding: '1rem' }}>KES {totalAmount.toLocaleString()}</td>
                                    <td style={{ padding: '1rem', color: isOverdue ? 'var(--destructive)' : 'var(--success)', fontWeight: 'bold' }}>
                                        KES {totalPaid.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                        KES {totalBalance.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {isOverdue ? (
                                            <span className="badge badge-destructive">
                                                Overdue ({overdueDays} Days)
                                            </span>
                                        ) : (
                                            <span className="badge badge-success">Paid</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {booking.invoice && (
                                            <Link href={`/invoices/${booking.invoice.id}`} target="_blank" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', textDecoration: 'none', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                                                Invoice
                                            </Link>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {(() => {
                                            const pendingPayment = payments.find(p => p.bookingId === booking.id && p.status === 'Pending');
                                            const defaultAmount = pendingPayment ? pendingPayment.amount : totalBalance;

                                            if (user.role === 'Admin') {
                                                return (
                                                    <input
                                                        type="number"
                                                        id={`amount-${booking.id}`}
                                                        defaultValue={defaultAmount > 0 ? defaultAmount : ''}
                                                        placeholder="Amount"
                                                        className="input"
                                                        style={{ padding: '0.25rem', fontSize: '0.75rem', width: '80px' }}
                                                    />
                                                );
                                            }
                                            return <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>;
                                        })()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {(() => {
                                            if (user.role === 'Admin') {
                                                return (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <select
                                                            id={`active-method-${booking.id}`}
                                                            className="input"
                                                            style={{ padding: '0.25rem', fontSize: '0.75rem', width: 'auto' }}
                                                            defaultValue="Cash"
                                                        >
                                                            <option value="Cash">Cash</option>
                                                            <option value="M-Pesa">M-Pesa</option>
                                                            <option value="Bank Transfer">Bank Transfer</option>
                                                            <option value="Cheque">Cheque</option>
                                                        </select>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                            onClick={() => {
                                                                const select = document.getElementById(`active-method-${booking.id}`) as HTMLSelectElement;
                                                                const amountInput = document.getElementById(`amount-${booking.id}`) as HTMLInputElement;
                                                                const amount = parseFloat(amountInput.value);
                                                                if (isNaN(amount) || amount <= 0) {
                                                                    alert("Please enter a valid amount.");
                                                                    return;
                                                                }
                                                                handleRecordPayment(booking.id, amount, select.value);
                                                            }}
                                                        >
                                                            Pay
                                                        </button>
                                                        {/* Show Unpaid button if there are paid payments */}
                                                        {payments.some(p => p.bookingId === booking.id && p.status === 'Paid') && (
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', color: 'var(--destructive)', borderColor: 'var(--destructive)' }}
                                                                onClick={async () => {
                                                                    const lastPaid = payments.filter(p => p.bookingId === booking.id && p.status === 'Paid').pop();
                                                                    if (lastPaid && confirm('Revert last payment to Pending?')) {
                                                                        const res = await markPaymentAsUnpaid(lastPaid.id);
                                                                        alert(res.message);
                                                                    }
                                                                }}
                                                            >
                                                                Unpaid
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>;
                                        })()}
                                    </td>
                                </tr>
                            );
                        })}
                        {bookings.filter(b => b.status === 'Active').length === 0 && (
                            <tr>
                                <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No active rentals to track.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <button
                        onClick={() => { setBookingIdFilter(null); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: !bookingIdFilter ? '2px solid var(--primary)' : 'none',
                            color: !bookingIdFilter ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: !bookingIdFilter ? 'bold' : 'normal',
                            cursor: 'pointer',
                            padding: '0.5rem 1rem'
                        }}
                    >
                        All Payments
                    </button>
                    <button
                        onClick={() => { setBookingIdFilter('CLIENT_VIEW'); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: bookingIdFilter === 'CLIENT_VIEW' || (bookingIdFilter && bookingIdFilter !== 'CLIENT_VIEW') ? '2px solid var(--primary)' : 'none',
                            color: bookingIdFilter === 'CLIENT_VIEW' || (bookingIdFilter && bookingIdFilter !== 'CLIENT_VIEW') ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: bookingIdFilter === 'CLIENT_VIEW' || (bookingIdFilter && bookingIdFilter !== 'CLIENT_VIEW') ? 'bold' : 'normal',
                            cursor: 'pointer',
                            padding: '0.5rem 1rem'
                        }}
                    >
                        Client History
                    </button>
                </div>

                {bookingIdFilter === 'CLIENT_VIEW' ? (
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>Select a Client</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Client Name</th>
                                    <th style={{ padding: '1rem' }}>Total Bookings</th>
                                    <th style={{ padding: '1rem' }}>Total Paid</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(new Set(bookings.map(b => b.customerName))).map(clientName => {
                                    const clientBookings = bookings.filter(b => b.customerName === clientName);
                                    const clientBookingIds = clientBookings.map(b => b.id);
                                    const clientPayments = payments.filter(p => clientBookingIds.includes(p.bookingId) && p.status === 'Paid');
                                    const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);

                                    return (
                                        <tr key={clientName} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: '500' }}>{clientName}</td>
                                            <td style={{ padding: '1rem' }}>{clientBookings.length}</td>
                                            <td style={{ padding: '1rem' }}>KES {totalPaid.toLocaleString()}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                    onClick={() => {
                                                        // We need to filter by ALL bookings for this client.
                                                        // But our current filter only supports one booking ID.
                                                        // Let's repurpose the filter logic or just show the first booking?
                                                        // Ideally we want to see ALL payments for this client.
                                                        // Let's set a special filter mode or just list them here?
                                                        // For now, let's just use the first booking as a hack or better, update the filter logic.
                                                        // Actually, let's just render the payments for this client directly here if selected?
                                                        // No, let's use a new state or just filter by client name?
                                                        // Let's change the filter logic to support client name.
                                                        // But I can't change the state type easily without rewriting more.
                                                        // Let's just use a special string prefix "CLIENT:" + clientName
                                                        setBookingIdFilter(`CLIENT:${clientName}`);
                                                    }}
                                                >
                                                    View History
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (bookingIdFilter && bookingIdFilter.startsWith('CLIENT:')) ? (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setBookingIdFilter('CLIENT_VIEW')}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            >
                                &larr; Back to Clients
                            </button>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                History for: {bookingIdFilter.split(':')[1]}
                            </h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Booking Ref</th>
                                    <th style={{ padding: '1rem' }}>Amount</th>
                                    <th style={{ padding: '1rem' }}>Due Date</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Invoice</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.filter(p => {
                                    const clientName = bookingIdFilter.split(':')[1];
                                    const booking = bookings.find(b => b.id === p.bookingId);
                                    return booking && booking.customerName === clientName;
                                }).map(payment => {
                                    const booking = getBookingDetails(payment.bookingId);
                                    return (
                                        <tr key={payment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                {booking ? `${booking.customerName} (Ref: ${booking.id})` : 'Unknown'}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>KES {payment.amount.toLocaleString()}</td>
                                            <td style={{ padding: '1rem' }}>{payment.dueDate}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`badge badge-${payment.status === 'Paid' ? 'success' : payment.status === 'Pending' ? 'warning' : 'destructive'}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {booking?.invoice ? (
                                                    <Link href={`/invoices/${booking.invoice.id}`} target="_blank" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', textDecoration: 'none' }}>
                                                        View Invoice
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {payment.status !== 'Paid' && user.role === 'Admin' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <select
                                                            id={`method-${payment.id}`}
                                                            className="input"
                                                            style={{ padding: '0.25rem', fontSize: '0.75rem', width: 'auto' }}
                                                            defaultValue="Cash"
                                                        >
                                                            <option value="Cash">Cash</option>
                                                            <option value="M-Pesa">M-Pesa</option>
                                                            <option value="Bank Transfer">Bank Transfer</option>
                                                            <option value="Cheque">Cheque</option>
                                                        </select>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                            onClick={() => {
                                                                const select = document.getElementById(`method-${payment.id}`) as HTMLSelectElement;
                                                                handleMarkPaid(payment.id, select.value);
                                                            }}
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Booking Ref</th>
                                <th style={{ padding: '1rem' }}>Amount</th>
                                <th style={{ padding: '1rem' }}>Due Date</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Invoice</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(payment => {
                                const booking = getBookingDetails(payment.bookingId);
                                return (
                                    <tr key={payment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {booking ? `${booking.customerName} (Ref: ${booking.id})` : 'Unknown'}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>KES {payment.amount.toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>{payment.dueDate}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge badge-${payment.status === 'Paid' ? 'success' : payment.status === 'Pending' ? 'warning' : 'destructive'}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {booking?.invoice ? (
                                                <Link href={`/invoices/${booking.invoice.id}`} target="_blank" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', textDecoration: 'none' }}>
                                                    View Invoice
                                                </Link>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {payment.status !== 'Paid' && user.role === 'Admin' && (
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <select
                                                        id={`method-${payment.id}`}
                                                        className="input"
                                                        style={{ padding: '0.25rem', fontSize: '0.75rem', width: 'auto' }}
                                                        defaultValue="Cash"
                                                    >
                                                        <option value="Cash">Cash</option>
                                                        <option value="M-Pesa">M-Pesa</option>
                                                        <option value="Bank Transfer">Bank Transfer</option>
                                                        <option value="Cheque">Cheque</option>
                                                    </select>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                        onClick={() => {
                                                            const select = document.getElementById(`method-${payment.id}`) as HTMLSelectElement;
                                                            handleMarkPaid(payment.id, select.value);
                                                        }}
                                                    >
                                                        Mark Paid
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {filteredPayments.length === 0 && !bookingIdFilter && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        No payments found for this period.
                    </div>
                )}
            </div>
        </div>

    );
}
